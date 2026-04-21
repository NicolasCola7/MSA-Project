import { Vehicle } from './vehicle.model';
import { PaymentSummary, VehicleRideStatus } from './rental.model';

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT ASSUMPTION (based on choreography + Zeebe workers)
//
// All messages arrive on ws://.../ws/vehicles?userId=<id>
// Each message has a discriminant `type` field.
//
// Workers that push these messages:
//   VEHICLES_AVAILABLE   ← ReturnVehiclesWorker       (show_available_vehicles flow)
//   RENTAL_STARTED       ← RentalStartedWorker        (scan_qr flow)
//   STATUS_UPDATE        ← StatusPushWorker           (monitoring loop — periodic)
//   RIDE_ENDED           ← RideEndedWorker            (end_ride flow)
//   RESERVATION_CONFIRMED← ReservationConfirmedWorker (reservation flow)
//   RESERVATION_CANCELLED← ReservationCancelledWorker (cancellation flow)
//   PROCESS_ERROR        ← any worker on Zeebe error boundary
// ─────────────────────────────────────────────────────────────────────────────

// ── 1 — getVehicles (IMPLEMENTED) ────────────────────────────────────────────
export interface WsVehiclesAvailableMessage {
  type: 'VEHICLES_AVAILABLE';
  count: number;
  vehicles: Vehicle[];
}

// ── 2 — scanQR / immediate rental ────────────────────────────────────────────
export interface WsRentalStartedMessage {
  type: 'RENTAL_STARTED';
  rentalId: string;
  vehicleId: string;
  vehicleModel: string;
  bankToken: string;          // Cauzione €10 pre-autorizzata
  startTime: string;          // ISO-8601
}

// ── 3 — monitoring loop (periodic push from FleetManagement via Zeebe) ────────
export interface WsStatusUpdateMessage {
  type: 'STATUS_UPDATE';
  rentalId: string;
  vehicleStatus: VehicleRideStatus;
}

// ── 4 — end ride + payment ────────────────────────────────────────────────────
export interface WsRideEndedMessage {
  type: 'RIDE_ENDED';
  rentalId: string;
  payment: PaymentSummary;
}

// ── 5 — reservation flow ─────────────────────────────────────────────────────
export interface WsReservationConfirmedMessage {
  type: 'RESERVATION_CONFIRMED';
  reservationId: string;
  vehicleId: string;
  slotStart: string;
  slotEnd: string;
}

// ── 6 — reservation cancellation ─────────────────────────────────────────────
export interface WsReservationCancelledMessage {
  type: 'RESERVATION_CANCELLED';
  reservationId: string;
  refunded: boolean;
}

// ── 7 — generic process error (Zeebe boundary event) ─────────────────────────
export interface WsProcessErrorMessage {
  type: 'PROCESS_ERROR';
  flow: string;               // e.g. "block_money", "unlock_vehicle"
  reason: string;
  retryable: boolean;
}

// ── Union type — exhaustive discriminated union ───────────────────────────────
export type WsInboundMessage =
  | WsVehiclesAvailableMessage
  | WsRentalStartedMessage
  | WsStatusUpdateMessage
  | WsRideEndedMessage
  | WsReservationConfirmedMessage
  | WsReservationCancelledMessage
  | WsProcessErrorMessage;
