import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Vehicle, batteryClass, vehicleIcon } from '@core/models/vehicle.model';

@Component({
  selector: 'acme-vehicle-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vehicle-card.component.html',
  styleUrl: './vehicle-card.component.scss',
})
export class VehicleCardComponent {
  readonly vehicle  = input.required<Vehicle>();
  readonly selected = output<Vehicle>();

  protected readonly icon          = computed(() => vehicleIcon(this.vehicle().type));
  protected readonly battLevelClass = computed(() => batteryClass(this.vehicle().batteryLevel));

  protected onSelect(): void {
    this.selected.emit(this.vehicle());
  }
}
