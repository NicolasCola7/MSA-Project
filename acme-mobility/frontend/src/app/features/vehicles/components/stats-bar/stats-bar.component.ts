import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { VehicleStats } from '@core/models/vehicle.model';

@Component({
  selector: 'acme-stats-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stats-bar.component.html',
  styleUrl: './stats-bar.component.scss',
})
export class StatsBarComponent {
  readonly stats = input.required<VehicleStats>();
}
