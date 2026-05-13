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
    loadComponent: () =>
      import('./features/vehicles/vehicles.component').then(m => m.VehiclesComponent),
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
    path: 'init',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/init/init-process.component').then(
        m => m.InitProcessComponent,
      ),
  },

  {
    path: 'book-at-station',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/booking/booking-selection.component').then(
        m => m.BookingSelectionComponent,
      ),
  },

  { path: '**', redirectTo: 'map' },
];
