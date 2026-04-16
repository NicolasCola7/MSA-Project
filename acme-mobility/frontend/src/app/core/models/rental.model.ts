// ── Reservation ───────────────────────────────────────────────────────────────

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'FULFILLED';

export interface Reservation {
  id: string;
  userId: string;
  vehicleId: string;
  vehicleModel: string;
  stationId: string;
  stationName: string;
  slotStart: string;   // ISO-8601
  slotEnd: string;     // ISO-8601 (max +30min from slotStart)
  status: ReservationStatus;
  createdAt: string;
}

export interface CreateReservationRequest {
  userId: string;
  vehicleId: string;
  slotStart: string;
  slotEnd: string;
}

export interface CreateReservationResponse {
  message: string;
  reservationId: string;
  processInstanceKey?: string;
}

export interface CancelReservationResponse {
  message: string;
  refunded: boolean;
}

// ── Rental (active ride) ───────────────────────────────────────────────────────

export type RentalStatus = 'STARTING' | 'ACTIVE' | 'ENDING' | 'COMPLETED' | 'FAILED';

export interface Rental {
  id: string;
  userId: string;
  vehicleId: string;
  vehicleModel: string;
  stationStartId: string;
  stationStartName: string;
  stationEndId?: string;
  stationEndName?: string;
  startTime: string;         // ISO-8601
  endTime?: string;          // ISO-8601
  status: RentalStatus;
  bankToken?: string;        // Cauzione pre-autorizzata (€10)
  finalCost?: number;        // Calcolato al termine
  penaltyApplied?: boolean;  // true se batteria < 15% al rientro
}

export interface StartRentalRequest {
  userId: string;
  vehicleId: string;      // scansionato dal QR
}

export interface StartRentalResponse {
  message: string;
  processInstanceKey?: string;
}

export interface EndRentalRequest {
  userId: string;
  rentalId: string;
  stationId: string;    // stazione di riconsegna
}

export interface EndRentalResponse {
  message: string;
  finalCost: number;
  penaltyApplied: boolean;
}

// ── Live vehicle status (during ride) ────────────────────────────────────────

export interface VehicleRideStatus {
  vehicleId: string;
  latitude: number;
  longitude: number;
  batteryLevel: number;
  speed?: number;            // km/h opzionale (da TrackingService)
  lastUpdated: string;       // ISO-8601
}

// ── Payment summary ───────────────────────────────────────────────────────────

export interface PaymentSummary {
  rentalId: string;
  durationMinutes: number;
  distanceKm: number;
  baseCost: number;
  penalty: number;
  totalCost: number;
  bankToken: string;
  chargedAt: string;
}
