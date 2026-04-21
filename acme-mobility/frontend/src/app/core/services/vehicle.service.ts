import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, filter, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { environment } from '@env/environment';
import {
  Vehicle,
  VehiclesAcceptedResponse,
  VehicleStats,
  computeStats,
} from '@core/models/vehicle.model';
import { WsVehiclesAvailableMessage } from '@core/models/ws-messages.model';
import { TraceLog, createLog } from '@core/models/trace-log.model';
import { WebSocketService, WsConnectionState } from './websocket.service';

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
  private readonly ws   = inject(WebSocketService);

  // ── Public Signals ─────────────────────────────────────────────────────────
  readonly vehicles     = signal<Vehicle[]>([]);
  readonly stats        = computed<VehicleStats>(() => computeStats(this.vehicles()));
  readonly loadingState = signal<LoadingState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly logs         = signal<TraceLog[]>([]);

  // ── Re-export WS state for the status bar ─────────────────────────────────
  readonly wsState       = this.ws.connectionState;
  readonly isWsConnected = this.ws.isConnected;

  // ── toObservable MUST be created in the constructor (injection context) ────
  // Storing it as a field so initialize() can subscribe to it later.
  private readonly wsState$: Observable<WsConnectionState>;

  private subs: Subscription[] = [];
  private userId = '';

  constructor() {
    // toObservable() called here → valid injection context ✅
    this.wsState$ = toObservable(this.ws.connectionState);
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

    // STEP 2 — Subscribe to the pre-built Observable.
    // take(1) auto-completes after the first terminal state,
    // so no manual unsubscribe is needed.
    const wsSub = this.wsState$
      .pipe(
        filter(state => state === 'connected' || state === 'error' || state === 'closed'),
        take(1),
      )
      .subscribe(state => {
        if (state === 'connected') {
          this.addLog('✅ WebSocket open — session registered', 'ok');
          this.callVehiclesApi();
        } else {
          this.handleError('WebSocket connection failed. Is the backend running?');
        }
      });

    this.subs.push(wsSub);
  }

  private callVehiclesApi(): void {
    this.loadingState.set('api-calling');
    this.addLog(`GET ${environment.apiBase}/vehicles → 202 Accepted expected`);

    const httpSub = this.http
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

    this.subs.push(httpSub);
  }

  private listenToWsMessages(): void {
    const msgSub = this.ws.messages$
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