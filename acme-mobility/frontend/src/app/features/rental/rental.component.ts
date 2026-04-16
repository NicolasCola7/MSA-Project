import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Rental feature shell.
 *
 * Child routes (all stubs — activated when backend implements them):
 *   /rental/scan          ← Scan QR → immediate rental start
 *   /rental/active/:id    ← Live ride (battery, GPS, timer)
 *   /rental/end/:id       ← Return vehicle + payment summary
 */
@Component({
  selector: 'acme-rental',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="rental-shell">
      <router-outlet />
    </main>
  `,
  styles: [`
    .rental-shell {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      max-width: 960px;
      margin: 0 auto;
      width: 100%;
    }
  `],
})
export class RentalComponent {}
