import { Routes } from '@angular/router';

import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  // ── Public routes (no guard) ──────────────────────────────────────────────
  {
    path: '',
    redirectTo: 'map',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },

  // ── Protected routes ──────────────────────────────────────────────────────
  // ── Flow 1: Get available vehicles (IMPLEMENTED) ──────────────────────────
  {
    path: 'map',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/vehicles/vehicles.routes').then(m => m.VEHICLES_ROUTES),
  },

  {
    path: 'scan',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/rental/components/scan-qr/scan-qr.component').then(
        m => m.ScanQrComponent,
      ),
  },

  {
    path: 'book',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/booking/booking-confirmation.component').then(
        m => m.BookingConfirmationComponent,
      ),
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

  { path: '**', redirectTo: 'map' },
];
