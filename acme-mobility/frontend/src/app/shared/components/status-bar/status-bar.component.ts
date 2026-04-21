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
      // ── stati flusso sincrono (attivo) ─────────────────────────────────────
      idle:            { dotClass: '',        text: 'Inizializzazione…' },
      loading:         { dotClass: 'loading', text: 'Caricamento veicoli…' },
      loaded:          { dotClass: 'ok',      text: 'Dati ricevuti.' },
      error:           { dotClass: 'error',   text: 'Errore connessione. Il backend è attivo?' },
      // ── stati flusso asincrono Zeebe (flussi futuri) ───────────────────────
      'ws-connecting': { dotClass: 'loading', text: 'Apertura WebSocket…' },
      'api-calling':   { dotClass: 'loading', text: 'Richiesta in corso…' },
      'waiting-push':  { dotClass: 'loading', text: 'Attesa risposta Zeebe…' },
    };
    return map[this.state()];
  });
}