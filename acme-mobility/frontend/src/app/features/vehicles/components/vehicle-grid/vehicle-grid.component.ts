import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Vehicle } from '@core/models/vehicle.model';
import { VehicleCardComponent } from '../vehicle-card/vehicle-card.component';
import { LoadingState } from '@core/services/vehicle.service';

@Component({
  selector: 'acme-vehicle-grid',
  standalone: true,
  imports: [VehicleCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vehicle-grid.component.html',
  styleUrl: './vehicle-grid.component.scss',
})
export class VehicleGridComponent {
  readonly vehicles        = input.required<Vehicle[]>();
  readonly loadingState    = input.required<LoadingState>();
  readonly vehicleSelected = output<Vehicle>();
}
