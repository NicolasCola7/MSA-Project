import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Reservation feature shell.
 *
 * Child routes (stubs — activated when backend implements them):
 *   /reservation/new          ← Book a vehicle (max 30 min in advance)
 *   /reservation/:id/cancel   ← Cancel reservation (free up to 5 min before)
 */
@Component({
  selector: 'acme-reservation',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="reservation-shell"><router-outlet /></main>`,
  styles: [`.reservation-shell { flex:1; display:flex; flex-direction:column; padding:1.5rem; max-width:960px; margin:0 auto; width:100%; }`],
})
export class ReservationComponent {}
