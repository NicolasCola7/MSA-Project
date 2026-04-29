import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, filter } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { environment } from '@env/environment';
import {
  Vehicle,
  VehiclesResponse,
  VehicleStats,
  computeStats,
} from '@core/models/vehicle.model';
import { WsVehiclesAvailableMessage } from '@core/models/ws-messages.model';
import { TraceLog, createLog } from '@core/models/trace-log.model';
import { WebSocketService, WsConnectionState } from './websocket.service';

export type LoadingState =
  | 'idle'
  | 'loading'
  | 'loaded'
  | 'error'
  | 'ws-connecting'
  | 'api-calling'
  | 'waiting-push';

@Injectable({ providedIn: 'root' })
export class VehicleService implements OnDestroy {

  private readonly http = inject(HttpClient);
  private readonly ws   = inject(WebSocketService);
  readonly vehicles     = signal<Vehicle[]>([]);
  readonly stats        = computed<VehicleStats>(() => computeStats(this.vehicles()));
  readonly loadingState = signal<LoadingState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly logs         = signal<TraceLog[]>([]);
  readonly wsState       = this.ws.connectionState;
  readonly isWsConnected = this.ws.isConnected;
  private readonly wsState$: Observable<WsConnectionState>;

  private subs: Subscription[] = [];

  constructor() {
    this.wsState$ = toObservable(this.ws.connectionState);
    this.listenToWsMessages();
  }

  loadVehicles(): void {
    this.loadingState.set('loading');
    this.addLog('GET /api/vehicles…');

    const sub = this.http
      .get<VehiclesResponse>(`${environment.apiBase}/vehicles`)
      .subscribe({
        next: res => {
          this.addLog(`✅ ${res.count} veicoli ricevuti`, 'ok');
          this.vehicles.set(res.vehicles);
          this.loadingState.set('loaded');
        },
        error: err => this.handleError(`Errore API: ${err.message}`),
      });

    this.subs.push(sub);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FLUSSO FUTURO — WS → HTTP → push Zeebe
  //
  // Da usare quando il backend implementerà operazioni orchestrate
  // (scan QR, prenotazione, ecc.) che richiedono il pattern asincrono.
  //
  // Esempio d'uso (non ancora attivo):
  //   this.ws.connect(userId);
  //   this.wsState$
  //     .pipe(filter(s => s === 'connected'), take(1))
  //     .subscribe(() => this.callZeebeFlow('/api/rental/scan', { vehicleId }));
  // ─────────────────────────────────────────────────────────────────────────

  private listenToWsMessages(): void {
    // Listener per VEHICLES_AVAILABLE — non più usato nel flusso attuale,
    // mantenuto per compatibilità nel caso in cui il backend ritorni al pattern Zeebe.
    const msgSub = this.ws.messages$
      .pipe(
        filter(
          (msg): msg is WsVehiclesAvailableMessage =>
            msg.type === 'VEHICLES_AVAILABLE',
        ),
      )
      .subscribe(msg => {
        this.addLog(`✅ WebSocket push: ${msg.count} veicoli ricevuti`, 'ok');
        this.vehicles.set(msg.vehicles);
        this.loadingState.set('loaded');
      });

    this.subs.push(msgSub);
  }

  private handleError(msg: string): void {
    this.addLog(`❌ ${msg}`, 'error');
    this.errorMessage.set(msg);
    this.loadingState.set('error');
  }

  addLog(message: string, level: TraceLog['level'] = 'info'): void {
    this.logs.update(prev => [...prev, createLog(message, level)]);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}