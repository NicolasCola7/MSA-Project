import { Routes } from '@angular/router';

/**
 * Flow 5 — Short reservation:
 *   Browser POST /api/reservation  { userId, vehicleId, slotStart, slotEnd }
 *   Zeebe: blocks vehicle, triggers BlockMoneyWorker (€10 cauzione)
 *   WS push: RESERVATION_CONFIRMED
 *
 * Flow 6 — Cancellation:
 *   Browser DELETE /api/reservation/:id
 *   If > 5 min before slot → full refund
 *   If ≤ 5 min OR no-show  → €10 cauzione converted to charge
 *   WS push: RESERVATION_CANCELLED  { reason, charged }
 */
export const RESERVATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reservation.component').then(m => m.ReservationComponent),
    children: [
      {
        path: 'new',
        loadComponent: () =>
          import('./components/create-reservation/create-reservation.component').then(
            m => m.CreateReservationComponent,
          ),
      },
      {
        path: ':id/cancel',
        loadComponent: () =>
          import('./components/cancel-reservation/cancel-reservation.component').then(
            m => m.CancelReservationComponent,
          ),
      },
    ],
  },
];
