import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { VehicleService } from '@core/services/vehicle.service';
import { Vehicle } from '@core/models/vehicle.model';
import { StatusBarComponent } from '@shared/components/status-bar/status-bar.component';
import { StatsBarComponent } from './components/stats-bar/stats-bar.component';
import { VehicleGridComponent } from './components/vehicle-grid/vehicle-grid.component';
import { ProcessTraceComponent } from './components/process-trace/process-trace.component';

@Component({
  selector: 'acme-vehicles',
  standalone: true,
  imports: [StatusBarComponent, StatsBarComponent, VehicleGridComponent, ProcessTraceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss',
})
export class VehiclesComponent implements OnInit {
  protected readonly vehicleService = inject(VehicleService);

  ngOnInit(): void {
    // Flusso sincrono: semplice GET REST, nessun userId necessario
    this.vehicleService.loadVehicles();
  }

  protected onVehicleSelected(vehicle: Vehicle): void {
    this.vehicleService.addLog(
      `Veicolo selezionato: ${vehicle.id} (${vehicle.model}) — prossimo step: scan QR o prenota`,
      'ok',
    );
    alert(`Veicolo ${vehicle.model} selezionato!\n\nProssimo step: scan QR o scelta fascia oraria.\n(Non ancora implementato)`);
  }
}