import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Vehicle } from '@core/models/vehicle.model';
import { VehicleCardComponent } from '../vehicle-card/vehicle-card.component';
import { LoadingState } from '@core/services/vehicle.service';

@Component({
  selector: 'acme-vehicle-grid',
  standalone: true,
  imports: [VehicleCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="vehicle-grid" aria-label="Available vehicles">

      @if (loadingState() === 'loaded' && vehicles().length === 0) {
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true">🔍</span>
          <p>No vehicles available near you.</p>
        </div>
      }

      @else if (loadingState() === 'error') {
        <div class="empty-state error">
          <span class="empty-icon" aria-hidden="true">⚠️</span>
          <p>Could not load vehicles.<br>Make sure the backend is running.</p>
        </div>
      }

      @else if (loadingState() !== 'loaded') {
        <div class="loader">
          <div class="spinner" role="status" aria-label="Loading vehicles"></div>
          <span>Waiting for vehicles via WebSocket…</span>
        </div>
      }

      @else {
        @for (vehicle of vehicles(); track vehicle.id) {
          <acme-vehicle-card
            [vehicle]="vehicle"
            (selected)="vehicleSelected.emit($event)" />
        }
      }

    </section>
  `,
  styles: [`
    .vehicle-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }

    .loader,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 3rem;
      color: #64748b;
      font-size: 0.9rem;
      grid-column: 1 / -1;
      text-align: center;

      p { line-height: 1.6; }
    }

    .empty-icon { font-size: 2.5rem; }

    .error { color: #f87171; }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #2d3250;
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class VehicleGridComponent {
  readonly vehicles = input.required<Vehicle[]>();
  readonly loadingState = input.required<LoadingState>();
  readonly vehicleSelected = output<Vehicle>();
}
