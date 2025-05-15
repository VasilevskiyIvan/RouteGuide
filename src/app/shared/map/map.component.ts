import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map: any;
  private routeLayer?: any;
  private markers: any[] = [];

  constructor() {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  private async initMap(): Promise<void> {
    try {
      const L = await import('leaflet');
      this.map = L.map(this.mapContainer.nativeElement)
        .setView([55.160077, 61.397225], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    } catch (error) {
      console.error('Ошибка инициализации Leaflet', error);
    }
  }

  public async drawRoute(route: any): Promise<void> {
    const L = await import('leaflet');
    this.clearRoute();
    try {
      if (route?.routes?.[0]?.geometry) {
        this.routeLayer = L.geoJSON(route.routes[0].geometry, {
          style: { color: 'rgb(23, 75, 45)', weight: 5 }
        }).addTo(this.map);
        if (this.routeLayer && this.routeLayer.getBounds().isValid()) {
          this.map.fitBounds(this.routeLayer.getBounds());
        }
      }
    } catch (error) {
      console.error('Ошибка отрисовки маршрута', error);
    }
  }

  public async addMarkers(start: [number, number], end: [number, number]): Promise<void> {
    const L = await import('leaflet');
    this.clearMarkers();
    try {
      const startMarkerInstance = L.marker(start).addTo(this.map).bindPopup('Начало').openPopup();
      this.markers.push(startMarkerInstance);
      const endMarkerInstance = L.marker(end).addTo(this.map).bindPopup('Конец');
      this.markers.push(endMarkerInstance);
    } catch (error) {
      console.error('Ошибка добавления маркеров', error);
    }
  }

  public async addMark(point: [number, number]): Promise<void> {
    const L = await import('leaflet');
    this.clearMarkers();
    try {
      const MarkInstance = L.marker(point).addTo(this.map).bindPopup('Я').openPopup();
      this.markers.push(MarkInstance);
    } catch (error) {
      console.error('Ошибка добавления маркеров', error);
    }
  }

  private clearRoute(): void {
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = undefined;
    }
  }

  private clearMarkers(): void {
    if (this.markers.length > 0) {
      this.markers.forEach(marker => this.map.removeLayer(marker));
      this.markers = [];
    }
  }
}