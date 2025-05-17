import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { RouteService } from '../../shared/services/route.service';
import { MapComponent } from '../../shared/map/map.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteInfo } from '../../shared/interfaces/route-info-inteface';
import { RouteInfoComponent } from '../../shared/route-info/route-info.component';
import { AuthService } from '../../shared/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../../shared/interfaces/user-interface';
import { timeFormat } from '../../shared/utils/timeFormat';

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
      alert('Введите адреса.');
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

    if (route?.routes?.[0]?.duration !== undefined && route?.routes?.[0]?.distance !== undefined) {
      this.routeInfo = {
        from: this.startAddress,
        to: this.endAddress,
        time: timeFormat(route.routes[0].duration),
        distance: `${(route.routes[0].distance / 1000).toFixed(2)} км`
      };
    } else {
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

  public position() {
    alert('Функционал определения позиции еще не реализован.');
  }
}