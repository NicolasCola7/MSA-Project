import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { SessionService } from '@core/services/session.service';
import { RentalService } from '@core/services/rental.service';

import { Vehicle } from '@core/models/vehicle.model';

type Phase = 'ready' | 'starting' | 'success' | 'error';

@Component({
  selector: 'acme-scan-qr',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scan-qr.component.html',
  styleUrl: './scan-qr.component.scss',
})
export class ScanQrComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);
  private readonly rentalService = inject(RentalService);


  readonly phase = signal<Phase>('ready');
  readonly vehicleId = signal<string>('');
  readonly errorMessage = signal<string>('');
  private rentalId?: string;

  // ── Computed signals ──────────────────────────────────────────────────────

  readonly vehicle = computed<Vehicle | null>(() => {
    const id = this.vehicleId();
    if (!id) return null;
    return this.rentalService.vehicles().find(v => String(v.id) === id) ?? null;
  });

  readonly canStart = computed(() =>
    !this.vehicle() || this.vehicle()!.status === 'AVAILABLE',
  );

  readonly emoji = computed(() => {
    const t = this.vehicle()?.type;
    return t === 'SCOOTER' ? '🛵' : t === 'KICK_SCOOTER' ? '🛴' : '🚗';
  });

  readonly batteryClass = computed(() => {
    const b = this.vehicle()?.batteryLevel ?? 100;
    return b >= 50 ? 'high' : b >= 20 ? 'medium' : 'low';
  });

  readonly statusClass = computed(() =>
    (this.vehicle()?.status ?? 'AVAILABLE').toLowerCase().replace('_', '-'),
  );

  readonly statusLabel = computed(() => {
    const labels: Record<string, string> = {
      AVAILABLE: 'Available',
      RESERVED: 'Reserved',
      IN_RENTAL: 'In rental',
      RENTED: 'Rented',
      MAINTENANCE: 'In maintenance',
      CHARGING: 'Charging',
    };
    return labels[this.vehicle()?.status ?? 'AVAILABLE'] ?? '';
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (this.rentalService.stations().length === 0) {
      this.rentalService.loadStations();
    }
  }

  updateVehicleId(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.vehicleId.set(input.value.trim());
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async startRental(): Promise<void> {
    if (!this.canStart()) return;
    this.phase.set('starting');

    this.rentalService.startRental({
      userId: this.sessionService.userId(),
      vehicleId: this.vehicleId(),
      accountId: this.sessionService.accountId(),
    });
  }

  goToActiveRide(): void {
    this.router.navigate(['/map']);
  }

  formatVehicleType(type: string | undefined): string {
    return type ? type.replace(/_/g, ' ') : '';
  }
}
