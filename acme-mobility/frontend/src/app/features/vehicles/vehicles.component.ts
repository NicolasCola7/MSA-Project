import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
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

  ngOnInit(): void {
    this.vehicleService.loadVehicles();
  }

  protected onVehicleSelected(vehicle: Vehicle): void {
    this.vehicleService.addLog(
      `Veicolo selezionato: ${vehicle.id} (${vehicle.model}) — prossimo step: scan QR o prenota`,
      'ok',
    );
    alert(
      `Veicolo ${vehicle.model} selezionato!\n\n` +
      `Prossimo step: scan QR o scelta fascia oraria.\n(Non ancora implementato)`,
    );
  }
}
