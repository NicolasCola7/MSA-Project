import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription, filter } from 'rxjs';

import { environment } from '@env/environment';
import {
  Reservation,
  CreateReservationRequest,
  CreateReservationResponse,
  CancelReservationResponse,
} from '@core/models/rental.model';
import {
  WsReservationConfirmedMessage,
  WsReservationCancelledMessage,
} from '@core/models/ws-messages.model';
import { TraceLog, createLog } from '@core/models/trace-log.model';
import { WebSocketService } from './websocket.service';

export type ReservationFlowState =
  | 'idle'
  | 'creating'
  | 'confirmed'
  | 'cancelling'
  | 'cancelled'
  | 'error';

@Injectable({ providedIn: 'root' })
export class ReservationService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly ws   = inject(WebSocketService);

  // ── Signals ────────────────────────────────────────────────────────────────
  readonly flowState          = signal<ReservationFlowState>('idle');
  readonly activeReservation  = signal<Reservation | null>(null);
  readonly logs               = signal<TraceLog[]>([]);

  private subs: Subscription[] = [];

  constructor() {
    this.listenToWsMessages();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/reservation  { userId, vehicleId, slotStart, slotEnd }
  // Max advance: 30 minutes. Triggers Zeebe short-reservation process.
  // ─────────────────────────────────────────────────────────────────────────
  createReservation(req: CreateReservationRequest): void {
    // TODO: implement when backend is ready
    this.addLog(`[STUB] POST /api/reservation  vehicleId=${req.vehicleId}`);
    this.flowState.set('creating');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE /api/reservation/:id
  // Free cancellation up to 5 min before slot start.
  // After that, €10 cauzione is converted to charge.
  // ─────────────────────────────────────────────────────────────────────────
  cancelReservation(reservationId: string): void {
    // TODO: implement when backend is ready
    this.addLog(`[STUB] DELETE /api/reservation/${reservationId}`);
    this.flowState.set('cancelling');
  }

  // ── WS listeners ──────────────────────────────────────────────────────────

  private listenToWsMessages(): void {
    // RESERVATION_CONFIRMED — Zeebe: ReservationConfirmedWorker push
    this.subs.push(
      this.ws.messages$
        .pipe(
          filter(
            (m): m is WsReservationConfirmedMessage =>
              m.type === 'RESERVATION_CONFIRMED',
          ),
        )
        .subscribe(msg => {
          this.addLog(`✅ Reservation confirmed: ${msg.reservationId}`, 'ok');
          this.activeReservation.set({
            id: msg.reservationId,
            userId: '',
            vehicleId: msg.vehicleId,
            vehicleModel: msg.vehicleModel,
            stationId: '',
            stationName: msg.stationName,
            slotStart: msg.slotStart,
            slotEnd: msg.slotEnd,
            status: 'CONFIRMED',
            createdAt: new Date().toISOString(),
          });
          this.flowState.set('confirmed');
        }),
    );

    // RESERVATION_CANCELLED — Zeebe: either user-triggered or timeout
    this.subs.push(
      this.ws.messages$
        .pipe(
          filter(
            (m): m is WsReservationCancelledMessage =>
              m.type === 'RESERVATION_CANCELLED',
          ),
        )
        .subscribe(msg => {
          const charged = msg.charged ? ' (€10 charged)' : ' (refunded)';
          this.addLog(
            `ℹ️ Reservation ${msg.reservationId} cancelled — reason: ${msg.reason}${charged}`,
            msg.charged ? 'warn' : 'info',
          );
          this.activeReservation.update(r =>
            r ? { ...r, status: msg.charged ? 'EXPIRED' : 'CANCELLED' } : r,
          );
          this.flowState.set('cancelled');
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
