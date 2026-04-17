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
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.scss',
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
