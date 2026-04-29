import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

import { VehicleService } from '@core/services/vehicle.service';
import { Vehicle } from '@core/models/vehicle.model';
import { StatusBarComponent } from '@shared/components/status-bar/status-bar.component';
import { StatsBarComponent } from './components/stats-bar/stats-bar.component';
import { VehicleMapComponent } from '@shared/components/vehicle-map/vehicle-map.component';
import { ProcessTraceComponent } from './components/process-trace/process-trace.component';

@Component({
  selector: 'acme-vehicles',
  standalone: true,
  imports: [
    StatusBarComponent,
    StatsBarComponent,
    VehicleMapComponent,
    ProcessTraceComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss',
})
export class VehiclesComponent implements OnInit {
  protected readonly vehicleService = inject(VehicleService);
  private  readonly router          = inject(Router);

  ngOnInit(): void {
    this.vehicleService.loadVehicles();
  }

  // ── Marker click (generic selection log) ──────────────────────────────────

  protected onVehicleSelected(vehicle: Vehicle): void {
    this.vehicleService.addLog(
      `Veicolo selezionato: ${vehicle.id} (${vehicle.model})`,
      'ok',
    );
  }

  // ── Popup → "Scan QR" button ──────────────────────────────────────────────
  // BPMN: Message_scanQR correlation path
  //   Browser → POST /api/rental/scan { vehicleId, userId }
  //   Zeebe:  BlockMoneyWorker → UnlockVehicleWorker → StartMonitoringWorker
  //   WS push: RENTAL_STARTED

  protected onScanQr(vehicle: Vehicle): void {
    this.vehicleService.addLog(
      `▶ Scan QR avviato per ${vehicle.model} (${vehicle.id})`,
      'info',
    );
    // Pass the pre-selected vehicleId so the scanner can confirm the match.
    this.router.navigate(['/rental/scan'], {
      queryParams: { vehicleId: vehicle.id },
    });
  }

  // ── Popup → "Prenota" button ──────────────────────────────────────────────
  // BPMN: reservation branch (not focus of this sprint)

  protected onPrenota(vehicle: Vehicle): void {
    this.vehicleService.addLog(
      `📅 Prenotazione avviata per ${vehicle.model} (${vehicle.id})`,
      'info',
    );
    this.router.navigate(['/reservation/create'], {
      queryParams: { vehicleId: vehicle.id },
    });
  }
}
