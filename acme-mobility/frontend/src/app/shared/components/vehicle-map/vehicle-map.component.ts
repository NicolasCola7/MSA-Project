import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { StationWithVehicles } from '@core/models/vehicle.model';

const BOLOGNA_CENTER: L.LatLngTuple = [44.494, 11.343];
const DEFAULT_ZOOM = 13;
const FIT_BOUNDS_PADDING: L.PointExpression = [40, 40];
const FIT_BOUNDS_MAX_ZOOM = 15;

@Component({
  selector: 'acme-vehicle-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vehicle-map.component.html',
  styleUrl: './vehicle-map.component.scss',
})
export class VehicleMapComponent implements AfterViewInit, OnDestroy {

  readonly stations = input<StationWithVehicles[]>([]);
  readonly bookAtStation = output<StationWithVehicles>();

  private readonly zone = inject(NgZone);
  private readonly mapContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  private map?: L.Map;
  private markersLayer?: L.LayerGroup;
  private hasAutoFitted = false;

  private stationById = new Map<string, StationWithVehicles>();

  constructor() {
    effect(() => {
      const stations = this.stations();
      if (this.map) {
        this.renderMarkers(stations);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    
    setTimeout(() => {
      this.map?.invalidateSize();
      this.renderMarkers(this.stations());
    }, 100);
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
  }

  // ── Map initialization ─────────────────────────────────────────────────────

  private initMap(): void {
    this.map = L.map(this.mapContainer().nativeElement, {
      center: BOLOGNA_CENTER,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
          'contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    ).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);

    this.map.on('popupopen', (e: L.PopupEvent) => {
      const container = e.popup.getElement();
      if (!container) return;

      container.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const stationId = btn.dataset['stationId'];
          const action = btn.dataset['action'];
          const station = stationId ? this.stationById.get(stationId) : undefined;

          if (!station) return;

          this.zone.run(() => {
            if (action === 'book') this.bookAtStation.emit(station);
          });

          this.map?.closePopup();
        });
      });
    });
  }

  // ── Markers rendering ──────────────────────────────────────────────────────

  private renderMarkers(stations: StationWithVehicles[]): void {
    if (!this.markersLayer || !this.map) return;

    this.markersLayer.clearLayers();
    this.stationById.clear();

    const geoStations = stations.filter((s) => {
      if (s.latitude == null || s.longitude == null) return false;
      const latitude = Number(s.latitude);
      const longitude = Number(s.longitude);
      return Number.isFinite(latitude) && Number.isFinite(longitude);
    });

    if (geoStations.length === 0) return;

    for (const s of geoStations) {
      this.stationById.set(String(s.id), s);

      const latitude = Number(s.latitude);
      const longitude = Number(s.longitude);

      const marker = L.marker([latitude, longitude], {
        icon: this.buildStationIcon(),
        title: s.name,
      });

      marker.bindPopup(this.buildPopupHtml(s), { minWidth: 200 });
      this.markersLayer.addLayer(marker);
    }

    if (!this.hasAutoFitted) {
      const bounds = L.latLngBounds(
        geoStations.map(s => [Number(s.latitude), Number(s.longitude)] as L.LatLngTuple),
      );
      this.map.fitBounds(bounds, {
        padding: FIT_BOUNDS_PADDING,
        maxZoom: FIT_BOUNDS_MAX_ZOOM,
      });
      this.hasAutoFitted = true;
    }
  }

  // ── Presentation helpers ───────────────────────────────────────────────────

  private buildStationIcon(): L.DivIcon {
    return L.divIcon({
      className: 'acme-station-marker',
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background-color: var(--color-accent);
          color: #0f172a;
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
          font-size: 18px;
          line-height: 1;
        ">
          📍
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -20],
    });
  }

  private buildPopupHtml(s: StationWithVehicles): string {
    const carsCount = s.vehicles.filter(v => v.type === 'CAR' && v.status === 'AVAILABLE').length;
    const scootersCount = s.vehicles.filter(v => v.type === 'SCOOTER' && v.status === 'AVAILABLE').length;
    const kickScootersCount = s.vehicles.filter(v => v.type === 'KICK_SCOOTER' && v.status === 'AVAILABLE').length;

    const totalAvailable = carsCount + scootersCount + kickScootersCount;
    const hasAvailable = totalAvailable > 0;

    return `
      <div class="station-popup">
        <div class="sp-header">
          <div class="sp-title">${this.escapeHtml(s.name)}</div>
        </div>

        <div class="sp-divider"></div>

        <div class="sp-info">
          <div class="sp-row">
            <span class="sp-label">🚗 Cars</span>
            <span class="sp-value">${carsCount}</span>
          </div>
          <div class="sp-row">
            <span class="sp-label">🛵 Scooters</span>
            <span class="sp-value">${scootersCount}</span>
          </div>
          <div class="sp-row">
            <span class="sp-label">🛴 Kick Scooters</span>
            <span class="sp-value">${kickScootersCount}</span>
          </div>
        </div>

        <div class="sp-actions">
          <button
            class="sp-btn sp-btn--book"
            data-action="book"
            data-station-id="${this.escapeHtml(s.id)}"
            ${!hasAvailable ? 'disabled' : ''}
            aria-label="Book at this station">
            Book
          </button>
        </div>
      </div>
    `;
  }

  private escapeHtml(value: string | number): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
