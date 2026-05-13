import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

import { RentalService } from '@core/services/rental.service';
import { StationWithVehicles } from '@core/models/vehicle.model';
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
  protected readonly rentalService = inject(RentalService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.rentalService.loadStations();
  }

  protected onBookAtStation(station: StationWithVehicles): void {
    this.rentalService.addLog(
      `▶ Navigating to booking selection for station: ${station.name}`,
      'info',
    );
    this.router.navigate(['/book-at-station'], {
      queryParams: {
        stationId: station.id,
        stationName: station.name,
      },
    });
  }

  protected goToScan(): void {
    this.router.navigate(['/scan']);
  }
}
