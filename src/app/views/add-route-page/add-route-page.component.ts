import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { RouteService } from '../../shared/services/route.service';
import { MapComponent } from '../../shared/map/map.component';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteInfo } from '../../shared/interfaces/route-info-inteface';
import { RouteInfoComponent } from '../../shared/route-info/route-info.component';
import { AuthService } from '../../shared/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../../shared/interfaces/user-interface';

@Component({
  selector: 'app-add-route-page',
  standalone: true,
  imports: [MapComponent, CommonModule, FormsModule, RouteInfoComponent],
  templateUrl: './add-route-page.component.html',
  styleUrl: './add-route-page.component.scss'
})
export class AddRoutePageComponent implements OnInit, OnDestroy {
  @ViewChild(MapComponent) mapComponent!: MapComponent;
  public startAddress = '';
  public endAddress = '';
  public mode = 'car';
  public routeInfo?: RouteInfo;
  private currentRoute: any;
  public currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private routeService: RouteService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStartAddressChange(value: string) {
    this.startAddress = value;
  }

  onEndAddressChange(value: string) {
    this.endAddress = value;
  }

  onModeChange(value: string) {
    this.mode = value;
  }

  async calculateRoute(): Promise<void> {
    if (!this.startAddress || !this.endAddress) {
      alert('Введите адреса');
      return;
    }

    try {
      const start = await this.routeService.geocode(this.startAddress);
      const end = await this.routeService.geocode(this.endAddress);
      this.mapComponent.addMarkers(start, end);
      const route = await this.routeService.getRoute(start, end, this.mode);
      this.processRouteData(route);
    } catch (error) {
      alert('Ошибка построения маршрута.');
      console.error('Ошибка расчета маршрута:', error);
    }
  }

  private processRouteData(route: any): void {
    this.mapComponent.drawRoute(route);
    this.currentRoute = route;
    this.currentRoute.startAddress = this.startAddress;
    this.currentRoute.endAddress = this.endAddress;
    this.currentRoute.mode = this.mode;

    if (route && route.routes && route.routes[0] && route.routes[0].duration !== undefined && route.routes[0].distance !== undefined) {
      this.routeInfo = {
        from: this.startAddress,
        to: this.endAddress,
        time: this.timeFormat(route.routes[0].duration),
        distance: `${(route.routes[0].distance / 1000).toFixed(2)} км`
      };
    } else {
      console.warn('Недостаточно данных о маршруте.');
      this.routeInfo = {
        from: this.startAddress,
        to: this.endAddress,
        time: 'Н/Д',
        distance: 'Н/Д'
      };
    }
  }

  public saveRoute(): void {
    if (!this.currentUser || !this.currentUser.id) {
      alert('Войдите в аккаунт для сохранения маршрута.');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.currentRoute) {
      alert('Сначала постройте маршрут.');
      return;
    }

    this.routeService.saveRoute(this.currentRoute, this.currentUser.id).pipe(takeUntil(this.destroy$)).subscribe();
  }

  private timeFormat(time: number | undefined | null): string {
    if (time === undefined || time === null || isNaN(time)) return `Не удается определить время`;

    let days = Math.floor(time / 86400);
    let hours = Math.floor((time % 86400) / 3600);
    let mins = Math.floor((time % 3600) / 60);
    let secs = Math.floor((time % 60) / 1);

    let parts: string[] = [];
    if (days > 0) parts.push(`${days} д`);
    if (hours > 0) parts.push(`${hours} ч`);
    if (mins > 0) parts.push(`${mins} мин`);
    if (secs > 0 && parts.length === 0) parts.push(`${secs} сек`);

    return parts.length > 0 ? parts.join(' ') : `Менее минуты`;
  }

  public position() {
    alert('Функционал определения позиции еще не реализован.');
  }
}