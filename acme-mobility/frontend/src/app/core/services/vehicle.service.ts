import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription, filter } from 'rxjs';

import { environment } from '@env/environment';
import {
  Vehicle,
  VehiclesAcceptedResponse,
  VehicleStats,
  computeStats,
  EMPTY_STATS,
} from '@core/models/vehicle.model';
import { WsVehiclesAvailableMessage } from '@core/models/ws-messages.model';
import { TraceLog, createLog } from '@core/models/trace-log.model';
import { WebSocketService } from './websocket.service';

export type LoadingState =
  | 'idle'
  | 'ws-connecting'
  | 'api-calling'
  | 'waiting-push'
  | 'loaded'
  | 'error';

@Injectable({ providedIn: 'root' })
export class VehicleService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly ws  = inject(WebSocketService);

  // ── Public Signals ─────────────────────────────────────────────────────────
  readonly vehicles     = signal<Vehicle[]>([]);
  readonly stats        = computed<VehicleStats>(() => computeStats(this.vehicles()));
  readonly loadingState = signal<LoadingState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly logs         = signal<TraceLog[]>([]);

  // ── Re-export WS state for the status bar ─────────────────────────────────
  readonly wsState      = this.ws.connectionState;
  readonly isWsConnected = this.ws.isConnected;

  private msgSub: Subscription | null = null;
  private userId = '';

  constructor() {
    this.listenToWsMessages();
  }

  /** Called once from VehiclesComponent.ngOnInit() */
  initialize(userId: string): void {
    this.userId = userId;
    this.addLog(`Session: ${userId}`);

    // STEP 1 — Open WebSocket FIRST
    this.loadingState.set('ws-connecting');
    this.addLog('Opening WebSocket connection…');
    this.ws.connect(userId);

    // STEP 2 — Poll until WS is open, then fire HTTP
    const interval = setInterval(() => {
      const state = this.ws.connectionState();
      if (state === 'connected') {
        clearInterval(interval);
        this.addLog('✅ WebSocket open — session registered', 'ok');
        this.callVehiclesApi();
      } else if (state === 'error' || state === 'closed') {
        clearInterval(interval);
        this.handleError('WebSocket connection failed. Is the backend running?');
      }
    }, 100);
  }

  private callVehiclesApi(): void {
    this.loadingState.set('api-calling');
    this.addLog(`GET ${environment.apiBase}/vehicles → 202 Accepted expected`);

    this.http
      .get<VehiclesAcceptedResponse>(
        `${environment.apiBase}/vehicles?userId=${this.userId}`,
      )
      .subscribe({
        next: res => {
          this.addLog(`✅ Server: "${res.message}"`, 'ok');
          this.addLog('⏳ Zeebe starting process instance…');
          this.addLog('⏳ Token → Service Task "get available vehicles"');
          this.addLog('⏳ GetAvailableVehiclesWorker polling job…');
          this.loadingState.set('waiting-push');
        },
        error: err => this.handleError(`API error: ${err.message}`),
      });
  }

  private listenToWsMessages(): void {
    this.msgSub = this.ws.messages$
      .pipe(
        filter(
          (msg): msg is WsVehiclesAvailableMessage =>
            msg.type === 'VEHICLES_AVAILABLE',
        ),
      )
      .subscribe(msg => {
        this.addLog(`✅ WebSocket push: ${msg.count} vehicles received`, 'ok');
        this.addLog('✅ ReturnVehiclesWorker completed Zeebe job', 'ok');
        this.addLog('⏳ Token → Catch Event "receive scan QR" (process waiting…)');
        this.vehicles.set(msg.vehicles);
        this.loadingState.set('loaded');
      });
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
    this.msgSub?.unsubscribe();
  }
}
