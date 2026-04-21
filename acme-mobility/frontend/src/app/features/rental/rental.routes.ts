import { Routes } from '@angular/router';

/**
 * All rental routes are lazy-loaded stubs.
 * Activate when the backend flow is implemented.
 *
 * Flow 2 — Scan QR:
 *   Browser POST /api/rental/scan  { vehicleId, userId }
 *   Zeebe correlates "Message_scanQR" on the open process instance
 *   Workers: BlockMoneyWorker → UnlockVehicleWorker → StartMonitoringWorker → RentalStartedWorker
 *   WS push: RENTAL_STARTED
 *
 * Flow 3 — Active ride (live monitoring loop):
 *   Zeebe monitoring loop triggers StatusPushWorker periodically
 *   WS push: STATUS_UPDATE  { latitude, longitude, batteryLevel }
 *
 * Flow 4 — End ride:
 *   Browser POST /api/rental/end  { rentalId, userId, stationId }
 *   Zeebe: LockVehicleWorker → StopMonitoringWorker → CalculateCostWorker → ChargeWorker
 *   WS push: RIDE_ENDED  { payment: { totalCost, penaltyApplied, … } }
 */
export const RENTAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./rental.component').then(m => m.RentalComponent),
    children: [
      {
        path: 'scan',
        loadComponent: () =>
          import('./components/scan-qr/scan-qr.component').then(
            m => m.ScanQrComponent,
          ),
      },
      {
        path: 'active/:id',
        loadComponent: () =>
          import('./components/active-ride/active-ride.component').then(
            m => m.ActiveRideComponent,
          ),
      },
      {
        path: 'end/:id',
        loadComponent: () =>
          import('./components/end-ride/end-ride.component').then(
            m => m.EndRideComponent,
          ),
      },
    ],
  },
];
