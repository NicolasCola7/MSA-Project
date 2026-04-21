import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { VehicleService } from '@core/services/vehicle.service';
import { SessionService } from '@core/services/session.service';
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
  private  readonly session         = inject(SessionService);

  ngOnInit(): void {
    this.vehicleService.initialize(this.session.userId());
  }

  protected onVehicleSelected(vehicle: Vehicle): void {
    this.vehicleService.addLog(
      `Vehicle selected: ${vehicle.id} (${vehicle.model}) — next: scan QR or reserve`,
      'ok',
    );
    alert(`Vehicle ${vehicle.model} selected!\n\nNext step: scan QR code or choose time slot.\n(Not yet implemented)`);
  }
}
