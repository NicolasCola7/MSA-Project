import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LoadingState } from '@core/services/rental.service';

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
      // ── stati flusso sincrono (attivo) ─────────────────────────────────────
      idle:            { dotClass: '',        text: 'Initializing...' },
      loading:         { dotClass: 'loading', text: 'Loading vehicles...' },
      loaded:          { dotClass: 'ok',      text: 'Data received.' },
      error:           { dotClass: 'error',   text: 'Connection error. Is the backend running?' },
      // ── stati flusso asincrono Zeebe (flussi futuri) ───────────────────────
      'ws-connecting': { dotClass: 'loading', text: 'Opening WebSocket...' },
      'api-calling':   { dotClass: 'loading', text: 'Request in progress...' },
      'waiting-push':  { dotClass: 'loading', text: 'Waiting for Zeebe response...' },
    };
    return map[this.state()];
  });
}