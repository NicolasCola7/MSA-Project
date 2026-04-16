import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';

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
  imports: [
    StatusBarComponent,
    StatsBarComponent,
    VehicleGridComponent,
    ProcessTraceComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="vehicles-shell">

      <acme-status-bar
        [state]="vehicleService.loadingState()"
        [vehicleCount]="vehicleService.stats().total" />

      <acme-stats-bar
        [stats]="vehicleService.stats()" />

      <acme-vehicle-grid
        [vehicles]="vehicleService.vehicles()"
        [loadingState]="vehicleService.loadingState()"
        (vehicleSelected)="onVehicleSelected($event)" />

      <acme-process-trace
        [logs]="vehicleService.logs()" />

    </main>
  `,
  styles: [`
    .vehicles-shell {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      max-width: 960px;
      margin: 0 auto;
      width: 100%;
    }
  `],
})
export class VehiclesComponent implements OnInit {
  protected readonly vehicleService = inject(VehicleService);
  private readonly session = inject(SessionService);

  ngOnInit(): void {
    this.vehicleService.initialize(this.session.userId());
  }

  protected onVehicleSelected(vehicle: Vehicle): void {
    this.vehicleService.addLog(
      `Vehicle selected: ${vehicle.id} (${vehicle.model}) — next: scan QR or reserve`,
      'ok',
    );
    // TODO: navigate to rental flow when implemented
    alert(
      `Vehicle ${vehicle.model} selected!\n\nNext step: scan QR code or choose time slot.\n(Not yet implemented in this draft)`,
    );
  }
}
