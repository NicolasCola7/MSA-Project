import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'vehicles',
    pathMatch: 'full',
  },

  // ── Flow 1: Get available vehicles (IMPLEMENTED) ──────────────────────────
  {
    path: 'vehicles',
    loadChildren: () =>
      import('./features/vehicles/vehicles.routes').then(m => m.VEHICLES_ROUTES),
  },

  // ── Flow 2–4: Rental (scan QR, active ride, end ride) — STUBS ─────────────
  {
    path: 'rental',
    loadChildren: () =>
      import('./features/rental/rental.routes').then(m => m.RENTAL_ROUTES),
  },

  // ── Flow 5–6: Reservation (book + cancel) — STUBS ─────────────────────────
  {
    path: 'reservation',
    loadChildren: () =>
      import('./features/reservation/reservation.routes').then(
        m => m.RESERVATION_ROUTES,
      ),
  },

  { path: '**', redirectTo: 'vehicles' },
];
