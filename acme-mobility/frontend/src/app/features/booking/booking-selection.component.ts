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

import { RentalService } from '@core/services/rental.service';
import { SessionService } from '@core/services/session.service';
import { StationWithVehicles, VehicleType } from '@core/models/vehicle.model';

interface VehicleTypeOption {
  type: VehicleType;
  label: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'acme-booking-selection',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-selection.component.html',
  styleUrl: './booking-selection.component.scss',
})
export class BookingSelectionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rentalService = inject(RentalService);
  private readonly sessionService = inject(SessionService);

  readonly stationId = signal<number | null>(null);
  readonly stationName = signal<string>('');
  readonly selectedType = signal<VehicleType | null>(null);
  
  readonly isBooking = signal(false);
  readonly isBookingSuccess = signal(false);
  readonly assignedVehicleId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly station = computed<StationWithVehicles | null>(() => {
    const id = this.stationId();
    if (id === null) return null;
    return this.rentalService.stations().find(s => s.id === id) ?? null;
  });

  readonly options = computed<VehicleTypeOption[]>(() => {
    const s = this.station();
    if (!s) return [];

    const carsCount = s.vehicles.filter(v => v.type === 'CAR' && v.status === 'AVAILABLE').length;
    const scootersCount = s.vehicles.filter(v => v.type === 'SCOOTER' && v.status === 'AVAILABLE').length;
    const kickScootersCount = s.vehicles.filter(v => v.type === 'KICK_SCOOTER' && v.status === 'AVAILABLE').length;

    return [
      { type: 'CAR', label: 'Car', icon: '🚗', count: carsCount },
      { type: 'SCOOTER', label: 'Scooter', icon: '🛵', count: scootersCount },
      { type: 'KICK_SCOOTER', label: 'Kick Scooter', icon: '🛴', count: kickScootersCount },
    ];
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.queryParamMap.get('stationId');
    if (idParam) {
      this.stationId.set(Number(idParam));
    }
    this.stationName.set(this.route.snapshot.queryParamMap.get('stationName') ?? 'Station');
    
    if (this.rentalService.stations().length === 0) {
      this.rentalService.loadStations();
    }
  }

  selectType(option: VehicleTypeOption): void {
    if (option.count > 0 && !this.isBooking() && !this.assignedVehicleId()) {
      this.selectedType.set(option.type);
      this.errorMessage.set(null);
    }
  }

  confirmBooking(): void {
    const type = this.selectedType();
    const sId = this.stationId();
    if (!type || sId === null || this.isBooking()) return;

    this.isBooking.set(true);
    this.errorMessage.set(null);

    this.rentalService.bookByType(
      this.sessionService.userId(),
      sId,
      type
    ).subscribe({
      next: (res) => {
        if (!res.success) {
          // Se la richiesta fallisce subito
          this.isBooking.set(false);
          this.errorMessage.set(res.message || 'Booking failed');
        } else {
          // In caso di successo della chiamata HTTP, non resettiamo isBooking a false.
          // In questo modo il componente rimane "bloccato" sullo spinner all'infinito, 
          // in attesa della logica bancaria futura (esattamente come scan-qr).
          console.log('Richiesta inviata a Zeebe. La UI rimarrà bloccata in attesa della banca.');
        }
      },
      error: (err) => {
        this.isBooking.set(false);
        this.errorMessage.set(err.error?.message || 'An error occurred during booking');
      },
    });
  }

  goToMap(): void {
    if (this.isBooking()) return;
    this.router.navigate(['/map']);
  }
}
