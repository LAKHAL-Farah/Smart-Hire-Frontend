import {
  Component, Input, AfterViewInit, OnDestroy,
  OnChanges, SimpleChanges, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-event-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="em-map-wrapper">

      <!-- Header -->
      <div class="em-map-header">
        <div class="em-map-pin-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="em-map-header-text">
          <div class="em-map-location-name">{{ location }}</div>
          <div class="em-map-coords" *ngIf="lat && lng">
            {{ lat.toFixed(4) }}°N · {{ lng.toFixed(4) }}°E
          </div>
        </div>
        <a
          class="em-map-open-btn"
          [href]="googleMapsUrl"
          target="_blank" rel="noopener noreferrer">
          Open in Maps ↗
        </a>
      </div>

      <!-- Map canvas -->
      <div class="em-map-canvas">
        <div *ngIf="loading" class="em-map-loading">
          <span class="spinner"></span> Locating…
        </div>
        <div *ngIf="geocodeError" class="em-map-error">
          📍 Could not locate "{{ location }}" on the map.
        </div>
        <div #mapContainer class="em-map-leaflet" [class.em-map-leaflet--hidden]="loading || geocodeError"></div>
      </div>

      <!-- Footer chips -->
      <div class="em-map-footer">
        <button class="em-map-chip" [class.em-map-chip--active]="mapType === 'map'" (click)="setMapType('map')">Map</button>
        <button class="em-map-chip" [class.em-map-chip--active]="mapType === 'satellite'" (click)="setMapType('satellite')">Satellite</button>
        <span class="em-map-footer-spacer"></span>
        <span class="em-map-coords-footer" *ngIf="lat && lng">{{ lat.toFixed(4) }}°N · {{ lng.toFixed(4) }}°E</span>
      </div>

    </div>
  `,
  styleUrls: ['./event-map.component.scss']
})
export class EventMapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() location = '';
  @Input() lat?: number;
  @Input() lng?: number;

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map?: L.Map;
  private marker?: L.Marker;
  private tileLayer?: L.TileLayer;

  loading = false;
  geocodeError = false;
  mapType: 'map' | 'satellite' = 'map';

  get googleMapsUrl(): string {
    if (this.lat && this.lng) {
      return `https://www.google.com/maps?q=${this.lat},${this.lng}`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(this.location)}`;
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['lat'] || changes['lng'] || changes['location']) && this.map) {
      this.updateMarker();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private async initMap(): Promise<void> {
    const coords = await this.resolveCoords();
    if (!coords) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: coords,
      zoom: 15,
      zoomControl: false,
    });

    this.tileLayer = this.buildTileLayer();
    this.tileLayer.addTo(this.map);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    this.marker = L.marker(coords, { icon: this.customIcon() }).addTo(this.map);
    this.marker.bindPopup(`<b>${this.location}</b>`).openPopup();
  }

  private async resolveCoords(): Promise<[number, number] | null> {
    if (this.lat && this.lng) return [this.lat, this.lng];

    if (!this.location) { this.geocodeError = true; return null; }

    this.loading = true;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.location)}&limit=1`
      );
      const data = await res.json();
      if (!data?.length) { this.geocodeError = true; return null; }
      this.lat = parseFloat(data[0].lat);
      this.lng = parseFloat(data[0].lon);
      return [this.lat, this.lng];
    } catch {
      this.geocodeError = true;
      return null;
    } finally {
      this.loading = false;
    }
  }

  private updateMarker(): void {
    if (!this.map || !this.lat || !this.lng) return;
    const coords: [number, number] = [this.lat, this.lng];
    this.map.setView(coords, 15);
    this.marker?.setLatLng(coords);
  }

  setMapType(type: 'map' | 'satellite'): void {
    this.mapType = type;
    this.tileLayer?.remove();
    this.tileLayer = this.buildTileLayer();
    this.tileLayer.addTo(this.map!);
  }

  private buildTileLayer(): L.TileLayer {
    if (this.mapType === 'satellite') {
      return L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© Esri' }
      );
    }
    return L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© CartoDB', subdomains: 'abcd', maxZoom: 19 }
    );
  }

  private customIcon(): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `
        <div style="
          width:36px; height:36px;
          background:#185FA5;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 2px 8px rgba(24,95,165,0.4);
          display:flex; align-items:center; justify-content:center;
        ">
          <div style="
            width:10px; height:10px;
            background:white;
            border-radius:50%;
            transform:rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });
  }
}