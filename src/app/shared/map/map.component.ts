import * as L from 'leaflet';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map: L.Map | null = null;
  private routeLayer?: L.GeoJSON;
  private markers: L.Marker[] = [];
  private mapIcon = L.icon({
    iconUrl: 'map-marker.svg',
    iconSize: [24, 45],
    iconAnchor: [12, 35],
  });

  constructor() {
    (L.Marker.prototype as any).options.icon = this.mapIcon;
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers = [];
    this.routeLayer = undefined;
  }

  private initMap(): void {
    try {
      if (!this.mapContainer || !this.mapContainer.nativeElement) {
        console.warn('Контейнер карты недоступен.');
        return;
      }
      if (this.map) {
        console.warn('Карта уже инициализирована.');
        return;
      }
      const mapInstance = L.map(this.mapContainer.nativeElement, {});
      this.map = mapInstance;
      if (!this.map) {
        console.error('Ошибка инициализации карты.');
        return;
      }
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
      if (this.mapContainer.nativeElement.offsetWidth > 0 && this.mapContainer.nativeElement.offsetHeight > 0) {
        this.map.setView([55.160077, 61.397225], 10);
      } else {
        console.warn('Невозможно установить вид карты: контейнер имеет нулевые размеры.');
      }
    } catch (error) {
      console.error('Ошибка инициализации карты:', error);
    }
  }

  public drawRoute(route: any): void {
    this.clearRoute();
    try {
      if (!this.map) {
        console.warn('Невозможно отобразить маршрут: карта не инициализирована.');
        return;
      }
      if (route?.routes?.[0]?.geometry) {
        this.routeLayer = L.geoJSON(route.routes[0].geometry, {
          style: { color: 'rgb(23, 75, 45)', weight: 5 }
        }).addTo(this.map);
        if (this.map && this.routeLayer && this.routeLayer.getBounds().isValid()) {
          this.map.fitBounds(this.routeLayer.getBounds());
        } else {
          console.warn('Невозможно масштабировать маршрут: некорректные границы.');
        }
      } else {
        console.warn('Невозможно отобразить маршрут: отсутствуют данные геометрии.');
      }
    } catch (error) {
      console.error('Ошибка отображения маршрута:', error);
    }
  }

  public addMarkers(start: [number, number], end: [number, number]): void {
    this.clearMarkers();
    try {
      if (!this.map) {
        console.warn('Невозможно добавить маркеры: карта не инициализирована.');
        return;
      }
      const startMarkerInstance = L.marker(start).addTo(this.map).bindPopup('Начало').openPopup();
      this.markers.push(startMarkerInstance);
      const endMarkerInstance = L.marker(end).addTo(this.map).bindPopup('Конец');
      this.markers.push(endMarkerInstance);
    } catch (error) {
      console.error('Ошибка добавления маркеров:', error);
    }
  }

  public addMark(point: [number, number]): void {
    this.clearMarkers();
    try {
      if (!this.map) {
        console.warn('Невозможно добавить маркер: карта не инициализирована.');
        return;
      }
      const MarkInstance = L.marker(point).addTo(this.map).bindPopup('Я').openPopup();
      this.markers.push(MarkInstance);
    } catch (error) {
      console.error('Ошибка добавления маркера:', error);
    }
  }

  private clearRoute(): void {
    if (this.routeLayer) {
      if (this.map && this.map.hasLayer(this.routeLayer)) {
        this.map.removeLayer(this.routeLayer);
      }
      this.routeLayer = undefined;
    }
  }

  private clearMarkers(): void {
    if (this.markers.length > 0) {
      if (this.map) {
        this.markers.forEach(marker => {
          if (this.map!.hasLayer(marker)) {
            this.map!.removeLayer(marker);
          }
        });
      } else {
        console.warn('Невозможно удалить маркеры: карта не инициализирована.');
      }
      this.markers = [];
    }
  }

  public recenterMap(latlng: [number, number] = [55.160077, 61.397225], zoom: number = 10): void {
    if (this.map) {
      this.map.setView(latlng, zoom);
    } else {
      console.warn('Невозможно отцентрировать карту: карта не инициализирована.');
    }
  }
}