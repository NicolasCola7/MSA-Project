import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { environment } from '@env/environment';
import { SessionService } from '@core/services/session.service';

@Component({
  selector: 'acme-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-header">
      <span class="logo" aria-hidden="true">🛴</span>
      <h1 class="title">ACMEMobility</h1>
      <span class="env-tag">{{ envTag }}</span>
      <span class="user-tag">👤 {{ session.userId() }}</span>
    </header>
  `,
  styles: [`
    .app-header {
      background: linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%);
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
    }

    .logo {
      font-size: 1.75rem;
    }

    .title {
      font-size: 1.3rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #fff;
    }

    .env-tag {
      font-size: 0.7rem;
      background: rgba(255, 255, 255, 0.15);
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      color: #fff;
    }

    .user-tag {
      margin-left: auto;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
    }
  `],
})
export class HeaderComponent {
  protected readonly session = inject(SessionService);
  protected readonly envTag = environment.envTag;
}
