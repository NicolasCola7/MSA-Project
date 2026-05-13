import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, filter } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { environment } from '@env/environment';
import {
  Rental,
  StartRentalRequest,
  StartRentalResponse,
  EndRentalRequest,
  EndRentalResponse,
} from '@core/models/rental.model';
import {
  Vehicle,
  VehiclesResponse,
  VehicleStats,
  computeStats,
} from '@core/models/vehicle.model';
import {
  WsRentalStartedMessage,
  WsStatusUpdateMessage,
  WsRideEndedMessage,
  WsVehiclesAvailableMessage,
} from '@core/models/ws-messages.model';
import { TraceLog, createLog } from '@core/models/trace-log.model';
import { WebSocketService, WsConnectionState } from './websocket.service';

export type RentalState = 'idle' | 'starting' | 'active' | 'ending' | 'completed' | 'error';
export type LoadingState = 'idle' | 'loading' | 'loaded' | 'error' | 'ws-connecting' | 'api-calling' | 'waiting-push';

export interface InitRentalResponse {
  processInstanceKey: number;
  success: boolean;
}

export interface BookVehicleRequest {
  userId: string;
  vehicleId: string;
}

export interface BookVehicleResponse {
  success: boolean;
  message: string;
  vehicleId: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class RentalService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly ws = inject(WebSocketService);

  // ── Signals Rental ────────────────────────────────────────────────────────
  readonly rentalState = signal<RentalState>('idle');
  readonly activeRental = signal<Rental | null>(null);
  readonly logs = signal<TraceLog[]>([]);

  // ── Signals Vehicles ──────────────────────────────────────────────────────
  readonly vehicles = signal<Vehicle[]>([]);
  readonly stats = computed<VehicleStats>(() => computeStats(this.vehicles()));
  readonly vehicleLoadingState = signal<LoadingState>('idle');
  readonly vehicleErrorMessage = signal<string | null>(null);

  readonly wsState = this.ws.connectionState;
  readonly isWsConnected = this.ws.isConnected;
  private readonly wsState$: Observable<WsConnectionState>;

  private subs: Subscription[] = [];

  constructor() {
    this.wsState$ = toObservable(this.ws.connectionState);
    this.listenToWsMessages();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VEHICLE LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  loadVehicles(): void {
    if (this.vehicleLoadingState() === 'loading') return;

    this.vehicleLoadingState.set('loading');
    this.addLog('GET /api/rentals/map…');

    const sub = this.http
      .get<VehiclesResponse>(`${environment.apiBase}/rentals/map`)
      .subscribe({
        next: res => {
          this.addLog(`✅ ${res.count} vehicles received`, 'ok');
          this.vehicles.set(res.vehicles);
          this.vehicleLoadingState.set('loaded');
        },
        error: err => this.handleVehicleError(`API Error: ${err.message}`),
      });

    this.subs.push(sub);
  }

  private handleVehicleError(msg: string): void {
    this.addLog(`❌ ${msg}`, 'error');
    this.vehicleErrorMessage.set(msg);
    this.vehicleLoadingState.set('error');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENTAL LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  initRentalProcess(userId: string): Observable<InitRentalResponse> {
    return this.http.post<InitRentalResponse>(`${environment.apiBase}/rentals/init`, { userId });
  }

  startRental(req: StartRentalRequest): void {
    this.rentalState.set('starting');

    this.http.post<StartRentalResponse>(`${environment.apiBase}/rentals/scan`, {
      userId: req.userId,
      vehicleId: req.vehicleId,
      accountId: req.accountId
    }).subscribe({
      next: (res) => {
        this.addLog(`✅ QR code scan request sent for vehicle: ${req.vehicleId}`);
      },
      error: (err) => {
        this.addLog(`❌ Error while sending QR code scan request: ${err.message}`, 'error');
        this.rentalState.set('error');
      }
    });
  }

  bookVehicle(req: BookVehicleRequest): Observable<BookVehicleResponse> {
    return this.http.post<BookVehicleResponse>(`${environment.apiBase}/rentals/book`, req);
  }

  endRental(req: EndRentalRequest): void {
    this.addLog(`[STUB] POST /api/rentals/end  rentalId=${req.rentalId}`);
    this.rentalState.set('ending');
  }

  // ── WS listeners ──────────────────────────────────────────────────────────

  private listenToWsMessages(): void {
    // RENTAL_STARTED — Zeebe: RentalStartedWorker push
    this.subs.push(
      this.ws.messages$
        .pipe(filter((m): m is WsRentalStartedMessage => m.type === 'RENTAL_STARTED'))
        .subscribe(msg => {
          this.addLog(`✅ Rental started: ${msg.rentalId}`, 'ok');
          this.activeRental.set({
            id: msg.rentalId,
            userId: '',
            vehicleId: msg.vehicleId,
            vehicleModel: msg.vehicleModel,
            stationStartId: '',
            stationStartName: '',
            startTime: msg.startTime,
            status: 'ACTIVE',
            bankToken: msg.bankToken,
          });
          this.rentalState.set('active');
        }),
    );

    // STATUS_UPDATE — Zeebe: periodic monitoring loop from FleetManagement
    this.subs.push(
      this.ws.messages$
        .pipe(filter((m): m is WsStatusUpdateMessage => m.type === 'STATUS_UPDATE'))
        .subscribe(msg => {
          this.addLog(`📍 Status update: battery ${msg.vehicleStatus.batteryLevel}%`);
        }),
    );

    // RIDE_ENDED — Zeebe: RideEndedWorker push (after lock + payment)
    this.subs.push(
      this.ws.messages$
        .pipe(filter((m): m is WsRideEndedMessage => m.type === 'RIDE_ENDED'))
        .subscribe(msg => {
          this.addLog(`✅ Ride ended. Total: €${msg.payment.totalCost}`, 'ok');
          this.activeRental.update(r => r ? { ...r, status: 'COMPLETED' } : r);
          this.rentalState.set('completed');
        }),
    );

    // VEHICLES_AVAILABLE
    this.subs.push(
      this.ws.messages$
        .pipe(filter((msg): msg is WsVehiclesAvailableMessage => msg.type === 'VEHICLES_AVAILABLE'))
        .subscribe(msg => {
          this.addLog(`✅ WebSocket push: ${msg.count} vehicles received`, 'ok');
          this.vehicles.set(msg.vehicles);
          this.vehicleLoadingState.set('loaded');
        }),
    );
  }

  addLog(message: string, level: TraceLog['level'] = 'info'): void {
    this.logs.update(prev => [...prev, createLog(message, level)]);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
