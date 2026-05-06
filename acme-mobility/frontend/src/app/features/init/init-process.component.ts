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
  templateUrl: './init-process.component.html',
  styleUrl: './init-process.component.css'
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