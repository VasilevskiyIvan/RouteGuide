import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { RouteService } from '../../shared/services/route.service';
import { MapComponent } from '../../shared/map/map.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { User } from '../../shared/interfaces/user-interface';
import { LoadRoute } from '../../shared/interfaces/route-server-interface';

@Component({
  selector: 'app-saved-page',
  standalone: true,
  imports: [CommonModule, MapComponent, FormsModule],
  templateUrl: './saved-page.component.html',
  styleUrl: './saved-page.component.scss'
})
export class SavedPageComponent implements OnInit, OnDestroy {
  @ViewChild(MapComponent) mapComponent!: MapComponent;
  public routes: LoadRoute[] | null = null;
  private allUserRoutes: LoadRoute[] = [];
  public filterFrom: string = "";
  public filterTo: string = "";
  public filterTime: string = "";
  public filterMode: string = "";
  public currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private routeService: RouteService,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.authService.currentUser.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      if (user && user.id) {
        this.loadRoutes(user.id);
      } else {
        this.routes = [];
        this.allUserRoutes = [];
      }
    });

    this.authService.currentUser.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRoutes(userId: string) {
    this.routeService.loadRoutes(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (routes) => {
        console.log(routes);
        this.allUserRoutes = (routes || []).map(route => {
          let createdAtDate: Date;
          if (route.createdAt && typeof route.createdAt === 'object' && typeof (route.createdAt as any).toDate === 'function') {
            createdAtDate = (route.createdAt as any).toDate();
          } else {
            console.error('Ошибка в преобразовании типа "Дата создания":', route.createdAt);
            createdAtDate = route.createdAt as any;
          }

          return {
            ...route,
            createdAt: createdAtDate
          };
        }) as LoadRoute[];
        this.applyFilters();
      },
      error: (err) => {
        console.error('Ошибка загрузки маршрутов:', err);
        this.allUserRoutes = [];
        this.routes = [];
        alert('Ошибка загрузки маршрутов.');
      }
    });
  }

  public applyFilters() {
    if (!this.allUserRoutes) {
      this.routes = [];
      return;
    }

    this.routes = this.allUserRoutes.filter(route => {
      if (this.filterFrom &&
        !route.startAddress.toLowerCase().includes(this.filterFrom.toLowerCase())) {
        return false;
      }

      if (this.filterTo &&
        !route.endAddress.toLowerCase().includes(this.filterTo.toLowerCase())) {
        return false;
      }

      if (this.filterMode && route.mode !== this.filterMode) {
        return false;
      }

      if (this.filterTime) {
        try {
          let dateToCompare: Date | null = null;
          dateToCompare = route.createdAt;
          const routeDateString = dateToCompare.toISOString().split('T')[0];
          if (routeDateString !== this.filterTime) {
            return false;
          }

        } catch (err) {
          console.error('Ошибка фильтрации по дате:', err);
          return false;
        }
      }

      return true;
    });
  }

  public resetFilters() {
    this.filterFrom = "";
    this.filterTo = "";
    this.filterTime = "";
    this.filterMode = "";
    this.routes = this.allUserRoutes;
  }

  public drawRoute(route: LoadRoute) {
    if (route && route.waypoints && route.waypoints.length >= 2 && route.waypoints[0].location && route.waypoints[1].location) {
      let start = route.waypoints[0].location.reverse();
      let end = route.waypoints[1].location.reverse();
      this.mapComponent.addMarkers(start as [number, number], end as [number, number]);
      this.mapComponent.drawRoute(route);
    } else {
      alert('Ошибка отрисовки маршрута.');
    }
  }

  public deleteRoute(event: Event, route: LoadRoute) {
    event.stopPropagation();
    this.routeService.deleteRoute(route.id!).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.allUserRoutes = this.allUserRoutes.filter(r => r.id !== route.id);
        this.applyFilters();
        alert('Маршрут удален.');
      },
      error: (err) => {
        console.error('Ошибка удаления маршрута:', err);
        alert('Ошибка удаления маршрута.');
      }
    });
  }
}