import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { VehicleStats } from '@core/models/vehicle.model';

@Component({
  selector: 'acme-stats-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="val">{{ stats().total === 0 ? '—' : stats().total }}</div>
        <div class="lbl">Available Vehicles</div>
      </div>
      <div class="stat-card">
        <div class="val">{{ stats().scooters === 0 ? '—' : stats().scooters }}</div>
        <div class="lbl">Scooters</div>
      </div>
      <div class="stat-card">
        <div class="val">{{ stats().kickScooters === 0 ? '—' : stats().kickScooters }}</div>
        <div class="lbl">Kick Scooters</div>
      </div>
      <div class="stat-card">
        <div class="val">{{ stats().cars === 0 ? '—' : stats().cars }}</div>
        <div class="lbl">Cars</div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: #1e2030;
      border: 1px solid #2d3250;
      border-radius: 10px;
      padding: 1rem;
      text-align: center;
      transition: border-color 0.2s;

      &:hover {
        border-color: #38bdf8;
      }
    }

    .val {
      font-size: 2rem;
      font-weight: 700;
      color: #38bdf8;
    }

    .lbl {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.2rem;
    }
  `],
})
export class StatsBarComponent {
  readonly stats = input.required<VehicleStats>();
}
