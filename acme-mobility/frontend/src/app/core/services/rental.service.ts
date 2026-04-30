import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription, filter } from 'rxjs';

import { environment } from '@env/environment';
import {
  Rental,
  StartRentalRequest,
  StartRentalResponse,
  EndRentalRequest,
  EndRentalResponse,
} from '@core/models/rental.model';
import {
  WsRentalStartedMessage,
  WsStatusUpdateMessage,
  WsRideEndedMessage,
} from '@core/models/ws-messages.model';
import { TraceLog, createLog } from '@core/models/trace-log.model';
import { WebSocketService } from './websocket.service';

export type RentalState = 'idle' | 'starting' | 'active' | 'ending' | 'completed' | 'error';

@Injectable({ providedIn: 'root' })
export class RentalService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly ws   = inject(WebSocketService);

  // ── Signals ────────────────────────────────────────────────────────────────
  readonly rentalState  = signal<RentalState>('idle');
  readonly activeRental = signal<Rental | null>(null);
  readonly logs         = signal<TraceLog[]>([]);

  private subs: Subscription[] = [];

  constructor() {
    this.listenToWsMessages();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/rental/scan  { vehicleId, userId }
  // Triggers Zeebe message correlation on "Message_scanQR"
  // ─────────────────────────────────────────────────────────────────────────
  startRental(req: StartRentalRequest): void {
    this.rentalState.set('starting');
    
    this.http.post<StartRentalResponse>(`${environment.apiBase}/api/rental/scan`, {
      userId: req.userId,
      vehicleId: req.vehicleId
    }).subscribe({
      next: (res) => {
        this.addLog(`✅ Richiesta scan QR inviata per veicolo: ${req.vehicleId}`);
      },
      error: (err) => {
        this.addLog(`❌ Errore durante lo scan del QR: ${err.message}`, 'error');
        this.rentalState.set('error');
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/rental/end  { rentalId, userId, stationId }
  // ─────────────────────────────────────────────────────────────────────────
  endRental(req: EndRentalRequest): void {
    // TODO: implement when backend is ready
    this.addLog(`[STUB] POST /api/rental/end  rentalId=${req.rentalId}`);
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
          // TODO: update map/live status panel
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
  }

  addLog(message: string, level: TraceLog['level'] = 'info'): void {
    this.logs.update(prev => [...prev, createLog(message, level)]);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
