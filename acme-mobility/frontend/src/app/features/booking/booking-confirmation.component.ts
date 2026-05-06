import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { Vehicle } from '@core/models/vehicle.model';
import { RentalService } from '@core/services/rental.service';
import { SessionService } from '@core/services/session.service';

@Component({
  selector: 'acme-booking-confirmation',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-confirmation.component.html',
  styleUrl: './booking-confirmation.component.scss',
})
export class BookingConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rentalService = inject(RentalService);
  private readonly sessionService = inject(SessionService);

  readonly vehicleId = signal<string>('');
  isLoading = false;

  readonly vehicle = computed<Vehicle | null>(() =>
    this.rentalService.vehicles().find(v => String(v.id) === this.vehicleId()) ?? null,
  );

  readonly canBook = computed(() =>
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
      RENTED: 'Rented',
      MAINTENANCE: 'In maintenance',
      CHARGING: 'Charging',
    };
    return labels[this.vehicle()?.status ?? 'AVAILABLE'] ?? '';
  });

  ngOnInit(): void {
    this.vehicleId.set(this.route.snapshot.queryParamMap.get('vehicleId') ?? '');
    this.rentalService.loadVehicles();
  }

  book(): void {
    if (!this.canBook() || this.isLoading) return;

    this.isLoading = true;

    this.rentalService.bookVehicle({
      userId: this.sessionService.userId(),
      vehicleId: this.vehicleId(),
    }).subscribe({
      next: () => {
        setTimeout(() => {
          this.isLoading = false;
          this.router.navigate(['/map']);
        }, 2000);
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }



  formatVehicleType(type: string | undefined): string {
    return type ? type.replace(/_/g, ' ') : '';
  }
}
