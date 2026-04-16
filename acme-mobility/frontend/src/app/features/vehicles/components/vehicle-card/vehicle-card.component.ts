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
  template: `
    <article class="vehicle-card" (click)="onSelect()">
      <div class="vc-header">
        <span class="vc-icon" aria-hidden="true">{{ icon() }}</span>
        <div class="vc-info">
          <div class="vc-title">{{ vehicle().model }}</div>
          <div class="vc-id">ID: {{ vehicle().id }}</div>
        </div>
        <span class="vc-badge">AVAILABLE</span>
      </div>

      <div class="vc-row">
        <span aria-hidden="true">📍</span>
        <span>{{ vehicle().stationName }}</span>
      </div>

      <div class="vc-row">
        <span aria-hidden="true">🔋</span>
        <span>Battery: {{ vehicle().batteryLevel }}%</span>
      </div>

      <div class="battery-bar" role="progressbar"
           [attr.aria-valuenow]="vehicle().batteryLevel"
           aria-valuemin="0" aria-valuemax="100">
        <div
          class="battery-fill"
          [class]="battLevelClass()"
          [style.width.%]="vehicle().batteryLevel">
        </div>
      </div>

      <button class="vc-action" (click)="onSelect(); $event.stopPropagation()">
        Rent now / Reserve
      </button>
    </article>
  `,
  styles: [`
    .vehicle-card {
      background: #1e2030;
      border: 1px solid #2d3250;
      border-radius: 12px;
      padding: 1.2rem;
      cursor: pointer;
      transition: transform 0.15s, border-color 0.15s;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;

      &:hover {
        transform: translateY(-2px);
        border-color: #38bdf8;
      }
    }

    .vc-header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.4rem;
    }

    .vc-icon { font-size: 1.8rem; }

    .vc-title {
      font-weight: 600;
      font-size: 0.95rem;
      color: #e2e8f0;
    }

    .vc-id {
      font-size: 0.7rem;
      color: #64748b;
    }

    .vc-badge {
      margin-left: auto;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      background: #14532d;
      color: #4ade80;
      white-space: nowrap;
    }

    .vc-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .battery-bar {
      height: 6px;
      border-radius: 999px;
      background: #2d3250;
      overflow: hidden;
      margin-top: 0.25rem;
    }

    .battery-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.4s;

      &.high   { background: #22c55e; }
      &.medium { background: #f59e0b; }
      &.low    { background: #ef4444; }
    }

    .vc-action {
      margin-top: 0.75rem;
      width: 100%;
      padding: 0.55rem;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #1e40af, #0ea5e9);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;

      &:hover { opacity: 0.85; }
    }
  `],
})
export class VehicleCardComponent {
  readonly vehicle = input.required<Vehicle>();
  readonly selected = output<Vehicle>();

  protected readonly icon = computed(() => vehicleIcon(this.vehicle().type));
  protected readonly battLevelClass = computed(() =>
    batteryClass(this.vehicle().batteryLevel),
  );

  protected onSelect(): void {
    this.selected.emit(this.vehicle());
  }
}
