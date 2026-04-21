import { Routes } from '@angular/router';

export const VEHICLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./vehicles.component').then(m => m.VehiclesComponent),
  },
];
