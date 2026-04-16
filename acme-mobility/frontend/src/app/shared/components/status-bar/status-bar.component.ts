import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LoadingState } from '@core/services/vehicle.service';

interface StatusConfig {
  dotClass: string;
  text: string;
}

@Component({
  selector: 'acme-status-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="status-bar" [class]="config().dotClass">
      <span class="dot"></span>
      <span class="status-text">{{ config().text }}</span>
      @if (vehicleCount() > 0) {
        <span class="vehicle-count">{{ vehicleCount() }} vehicles available</span>
      }
    </div>
  `,
  styles: [`
    .status-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #1e2030;
      border: 1px solid #2d3250;
      border-radius: 10px;
      padding: 0.9rem 1.2rem;
      font-size: 0.875rem;
      color: #e2e8f0;
    }
    .dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #6b7280;
      flex-shrink: 0;
      transition: background 0.3s;
    }
    .status-bar.loading .dot { background: #f59e0b; animation: pulse 1s infinite; }
    .status-bar.ok .dot      { background: #22c55e; }
    .status-bar.error .dot   { background: #ef4444; }
    .vehicle-count {
      margin-left: auto;
      font-size: 0.75rem;
      color: #38bdf8;
      font-weight: 600;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
  `],
})
export class StatusBarComponent {
  readonly state        = input.required<LoadingState>();
  readonly vehicleCount = input<number>(0);

  protected readonly config = computed<StatusConfig>(() => {
    const map: Record<LoadingState, StatusConfig> = {
      idle:            { dotClass: '',        text: 'Initializing…' },
      'ws-connecting': { dotClass: 'loading', text: 'Opening WebSocket connection…' },
      'api-calling':   { dotClass: 'loading', text: 'WebSocket connected. Requesting vehicles…' },
      'waiting-push':  { dotClass: 'loading', text: 'Process started on Zeebe. Waiting for vehicle push…' },
      loaded:          { dotClass: 'ok',      text: 'Data received.' },
      error:           { dotClass: 'error',   text: 'Connection error. Is the backend running?' },
    };
    return map[this.state()];
  });
}
