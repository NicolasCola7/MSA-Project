import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { Vehicle, vehicleIcon } from '@core/models/vehicle.model';

/**
 * Reusable Leaflet map that displays a collection of vehicles as markers.
 *
 * Responsibilities:
 *   - Mount/unmount a Leaflet map instance tied to the component lifecycle.
 *   - Render one marker per vehicle using a custom DivIcon with the type emoji.
 *   - Auto-fit the map bounds around the markers on first render only,
 *     so any later data refresh does not overwrite the user's manual pan/zoom.
 *   - Emit (vehicleSelected) when the user clicks a marker.
 *
 * Tiles: CartoDB Dark Matter (OSM-based) — fits the dark UI.
 * Plain OSM is left as a comment for easy switch.
 *
 * Why DivIcon instead of the default Leaflet marker?
 *   Default markers break under bundlers (Webpack/Vite) because Leaflet
 *   tries to resolve PNG paths relative to the JS file. DivIcon renders
 *   pure HTML/CSS, so it is immune to that whole class of problems.
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

  readonly vehicles        = input<Vehicle[]>([]);
  readonly vehicleSelected = output<Vehicle>();

  private readonly mapContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  private map?: L.Map;
  private markersLayer?: L.LayerGroup;
  private hasAutoFitted = false;

  constructor() {
    // Re-render markers whenever the vehicles() signal input changes.
    // The effect also fires once on registration — at that point this.map
    // is still undefined, so the guard below takes care of the early tick.
    // Subsequent ticks happen after ngAfterViewInit, so the map is ready.
    effect(() => {
      const vehicles = this.vehicles();
      if (this.map) {
        this.renderMarkers(vehicles);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.renderMarkers(this.vehicles());
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

    // Dark tiles to match the app theme.
    // Fallback OSM: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
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
  }

  // ── Markers rendering ──────────────────────────────────────────────────────

  private renderMarkers(vehicles: Vehicle[]): void {
    if (!this.markersLayer || !this.map) return;

    this.markersLayer.clearLayers();

    // Only vehicles that actually carry coordinates end up on the map.
    const geoVehicles = vehicles.filter(
      (v): v is Vehicle & { latitude: number; longitude: number } =>
        typeof v.latitude === 'number' && typeof v.longitude === 'number',
    );

    if (geoVehicles.length === 0) {
      return;
    }

    for (const v of geoVehicles) {
      const marker = L.marker([v.latitude, v.longitude], {
        icon: this.buildVehicleIcon(v),
        title: `${v.model} — battery ${v.batteryLevel}%`,
      });

      marker.bindPopup(this.buildPopupHtml(v));
      marker.on('click', () => this.vehicleSelected.emit(v));

      this.markersLayer.addLayer(marker);
    }

    // Fit bounds only once. Later data refreshes must not jerk the map
    // back while the user is interacting with it.
    if (!this.hasAutoFitted) {
      const bounds = L.latLngBounds(
        geoVehicles.map(v => [v.latitude, v.longitude] as L.LatLngTuple),
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
    const emoji = vehicleIcon(v.type);
    return L.divIcon({
      className: 'acme-vehicle-marker',
      html:
        `<div class="marker-bubble" title="${this.escapeHtml(v.model)}">` +
        `  <span aria-hidden="true">${emoji}</span>` +
        `</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22],
    });
  }

  private buildPopupHtml(v: Vehicle): string {
    return `
      <div class="vehicle-popup">
        <div class="vp-title">${this.escapeHtml(v.model)}</div>
        <div class="vp-id">ID: ${this.escapeHtml(v.id)}</div>
        <div class="vp-row">📍 ${this.escapeHtml(v.stationName)}</div>
        <div class="vp-row">🔋 Battery: ${v.batteryLevel}%</div>
      </div>
    `;
  }

  /** Minimal HTML escape for strings interpolated into innerHTML. */
  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
