import { Routes } from '@angular/router';

import { LoginComponent } from './features/login/login.component';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    pathMatch: 'full',
  },

  // ── Flow 1: Get available vehicles (IMPLEMENTED) ──────────────────────────
  {
    path: 'vehicles',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/vehicles/vehicles.routes').then(m => m.VEHICLES_ROUTES),
  },

  // ── Flow 2–4: Rental (scan QR, active ride, end ride) — STUBS ─────────────
  {
    path: 'rental',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/rental/rental.routes').then(m => m.RENTAL_ROUTES),
  },

  // ── Flow 5–6: Reservation (book + cancel) — STUBS ─────────────────────────
  {
    path: 'reservation',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/reservation/reservation.routes').then(
        m => m.RESERVATION_ROUTES,
      ),
  },

  { path: '**', redirectTo: 'vehicles' },
];
