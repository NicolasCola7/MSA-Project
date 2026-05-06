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
import { Vehicle, vehicleDisplayName, vehicleIcon, VehicleType } from '@core/models/vehicle.model';

/**
 * Reusable Leaflet map that displays a collection of vehicles as markers.
 *
 * Responsibilities:
 *   - Mount/unmount a Leaflet map instance tied to the component lifecycle.
 *   - Render one marker per vehicle using a custom DivIcon with the type emoji.
 *   - Auto-fit the map bounds around the markers on first render only,
 *     so any later data refresh does not overwrite the user's manual pan/zoom.
 *   - Emit (vehicleSelected) when the user clicks a marker.
 *   - Emit (scanQrSelected) / (prenotaSelected) when the user clicks
 *     the corresponding popup action button.
 *
 * Popup buttons sit inside raw Leaflet HTML (outside Angular's zone).
 * We use the map's "popupopen" event to attach DOM listeners after the popup
 * is inserted into the page, then re-enter NgZone before emitting outputs.
 *
 * Tiles: CartoDB Dark Matter (OSM-based) — fits the dark UI.
 */

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

  readonly vehicles = input<Vehicle[]>([]);
  readonly vehicleSelected = output<Vehicle>();
  readonly scanQrSelected = output<Vehicle>();
  readonly prenotaSelected = output<Vehicle>();

  private readonly zone = inject(NgZone);
  private readonly mapContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  private map?: L.Map;
  private markersLayer?: L.LayerGroup;
  private hasAutoFitted = false;

  /** Fast vehicle lookup when the user clicks a popup action button. */
  private vehicleById = new Map<string, Vehicle>();

  constructor() {
    effect(() => {
      const vehicles = this.vehicles();
      if (this.map) {
        this.renderMarkers(vehicles);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    
    // Vector 1 Fix: Leaflet calcola le dimensioni in modo sincrono. Se il DOM
    // Angular non ha ancora terminato il layout (es. flexbox), la mappa crede 
    // di essere 0x0. Forziamo il ricalcolo al prossimo tick.
    setTimeout(() => {
      this.map?.invalidateSize();
      this.renderMarkers(this.vehicles());
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

    // Wire popup action buttons after Leaflet inserts the popup into the DOM.
    // Leaflet fires this event AFTER the popup element is added, so we can
    // safely query-select the buttons and add native DOM listeners.
    // We re-enter NgZone so Angular change-detection fires correctly.
    this.map.on('popupopen', (e: L.PopupEvent) => {
      const container = e.popup.getElement();
      if (!container) return;

      container.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const vehicleId = btn.dataset['vehicleId'];
          const action = btn.dataset['action'];
          const vehicle = vehicleId ? this.vehicleById.get(vehicleId) : undefined;

          if (!vehicle) return;

          this.zone.run(() => {
            if (action === 'scan') this.scanQrSelected.emit(vehicle);
            if (action === 'book') this.prenotaSelected.emit(vehicle);
          });

          this.map?.closePopup();
        });
      });
    });
  }

  // ── Markers rendering ──────────────────────────────────────────────────────

  private renderMarkers(vehicles: Vehicle[]): void {
    if (!this.markersLayer || !this.map) return;

    this.markersLayer.clearLayers();
    this.vehicleById.clear();

    // Vector 3 Fix: Tolleranza per le coordinate passate come stringhe.
    // Un controllo stretto "typeof === 'number'" esclude i veicoli se il parser JSON 
    // converte i Double in stringhe (comune con alcuni setup Spring/Postgres).
    const geoVehicles = vehicles.filter((v) => {
      if (v.latitude == null || v.longitude == null) return false;
      const latitude = Number(v.latitude);
      const longitude = Number(v.longitude);
      return Number.isFinite(latitude) && Number.isFinite(longitude);
    });

    if (geoVehicles.length === 0) return;

    for (const v of geoVehicles) {
      this.vehicleById.set(String(v.id), v);

      const latitude = Number(v.latitude);
      const longitude = Number(v.longitude);

      const marker = L.marker([latitude, longitude], {
        icon: this.buildVehicleIcon(v),
        title: `${vehicleDisplayName(v)} - battery ${v.batteryLevel}%`,
      });

      marker.bindPopup(this.buildPopupHtml(v), { minWidth: 200 });
      marker.on('click', () => this.vehicleSelected.emit(v));

      // Vector 4 Fix: Usa solo il LayerGroup. Il LayerGroup è già agganciato alla mappa in initMap().
      // Chiamare marker.addTo(this.map) crea una referenza fantasma non ripulibile da clearLayers().
      this.markersLayer.addLayer(marker);
    }

    if (!this.hasAutoFitted) {
      const bounds = L.latLngBounds(
        geoVehicles.map(v => [Number(v.latitude), Number(v.longitude)] as L.LatLngTuple),
      );
      this.map.fitBounds(bounds, {
        padding: FIT_BOUNDS_PADDING,
        maxZoom: FIT_BOUNDS_MAX_ZOOM,
      });
      this.hasAutoFitted = true;
    }
  }

  // ── Presentation helpers ───────────────────────────────────────────────────

  private buildVehicleIcon(v: Vehicle): L.DivIcon {
    const icon = vehicleIcon(v.type);
    const borderColor = this.getVehicleColor(v.type);

    return L.divIcon({
      className: 'acme-vehicle-marker',
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background-color: #ffffff;
          border: 2.5px solid ${borderColor};
          border-radius: 50%;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.24);
          font-size: 18px;
          line-height: 1;
          user-select: none;
        ">
          ${icon}
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -18],
    });
  }

  private getVehicleColor(type: VehicleType): string {
    const colors: Record<VehicleType, string> = {
      CAR: '#ef4444',          // Vibrant Red
      SCOOTER: '#eab308',      // Bright Yellow
      KICK_SCOOTER: '#3b82f6', // Modern Blue
    };
    return colors[type] ?? '#94a3b8';
  }

  private buildPopupHtml(v: Vehicle): string {
    const title = v.model ?? this.formatVehicleType(v.type);
    const statusLabel = this.formatStatus(v.status);
    const statusClass = v.status.toLowerCase().replace('_', '-');
    const batteryClass = v.batteryLevel >= 50 ? 'high' : v.batteryLevel >= 20 ? 'medium' : 'low';

    // Buttons are enabled only for AVAILABLE vehicles.
    const canRent = v.status === 'AVAILABLE';
    const disabledAttr = canRent ? '' : 'disabled';
    const disabledTitle = canRent ? '' : `title="Vehicle not available (${statusLabel})"`;

    return `
      <div class="vehicle-popup">
        <div class="vp-header">
          <span class="vp-icon">${vehicleIcon(v.type)}</span>
          <div>
            <div class="vp-title">${this.escapeHtml(title)}</div>
            <div class="vp-id">ID: ${this.escapeHtml(v.id)}</div>
          </div>
        </div>

        <div class="vp-divider"></div>

        <div class="vp-info">
          <div class="vp-row">
            <span class="vp-label">Battery</span>
            <span class="vp-value battery-${batteryClass}">
              🔋 ${v.batteryLevel}%
            </span>
          </div>
          <div class="vp-row">
            <span class="vp-label">Status</span>
            <span class="vp-badge status-${statusClass}">${statusLabel}</span>
          </div>
        </div>

        <div class="vp-actions">
          <button
            class="vp-btn vp-btn--scan"
            data-action="scan"
            data-vehicle-id="${this.escapeHtml(v.id)}"
            ${disabledAttr} ${disabledTitle}
            aria-label="Scan QR to start rental">
            <span class="vp-btn-icon">📷</span> Scan QR
          </button>
          <button
            class="vp-btn vp-btn--book"
            data-action="book"
            data-vehicle-id="${this.escapeHtml(v.id)}"
            ${disabledAttr} ${disabledTitle}
            aria-label="Book vehicle">
            <span class="vp-btn-icon">📅</span> Book
          </button>
        </div>

        ${!canRent ? `<div class="vp-unavailable-note">⚠ ${statusLabel} — not bookable right now</div>` : ''}
      </div>
    `;
  }

  private formatStatus(status: string): string {
    const labels: Record<string, string> = {
      AVAILABLE: 'Available',
      RESERVED: 'Reserved',
      RENTED: 'Rented',
      MAINTENANCE: 'In Maintenance',
      CHARGING: 'Charging',
    };
    return labels[status] ?? status;
  }

  private formatVehicleType(type: string): string {
    return type.replace(/_/g, ' ');
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
