import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { RentalService } from '@core/services/rental.service';
import { SessionService } from '@core/services/session.service';

@Component({
  selector: 'acme-init-process',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="init-shell">
      @if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
        <button type="button" (click)="startProcess()">Retry</button>
      } @else {
        <div class="spinner"></div>
        <p>Initializing rental process...</p>
      }
    </main>
  `,
  styles: [`
    .init-shell {
      min-height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: var(--color-text);
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: spin 0.85s linear infinite;
    }

    .error {
      color: var(--color-error);
    }

    button {
      padding: 0.7rem 1.1rem;
      border: 0;
      border-radius: var(--radius-md);
      background: var(--color-accent);
      color: #0f172a;
      font-weight: 700;
      cursor: pointer;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class InitProcessComponent implements OnInit {
  private readonly rentalService = inject(RentalService);
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);

  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.startProcess();
  }

  startProcess(): void {
    this.errorMessage.set('');

    this.rentalService.initRentalProcess(this.sessionService.userId()).subscribe({
      next: (res) => {
        if (res?.processInstanceKey) {
          localStorage.setItem('currentProcessInstance', res.processInstanceKey.toString());
        }
        this.router.navigate(['/map']);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Unable to initialize rental process.');
      },
    });
  }
}
