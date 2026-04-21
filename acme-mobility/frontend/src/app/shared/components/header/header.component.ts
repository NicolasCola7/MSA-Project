import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { environment } from '@env/environment';
import { SessionService } from '@core/services/session.service';

@Component({
  selector: 'acme-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly session = inject(SessionService);
  protected readonly envTag = environment.envTag;
}
