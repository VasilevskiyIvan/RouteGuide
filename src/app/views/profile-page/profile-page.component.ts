import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter, switchMap, tap } from 'rxjs/operators';
import { User } from '../../shared/interfaces/user-interface';
import { RouteService } from '../../shared/services/route.service';
import { LoadRoute } from '../../shared/interfaces/route-server-interface';
import { timeFormat } from '../../shared/utils/timeFormat';

interface StatRow {
  label: string;
  lastMonth: string | number;
  allTime: string | number;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  public settings: any = null;
  public currentUser: User | null = null;
  public stats: StatRow[] = [];
  public isLoadingStats = true;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private routeService: RouteService
  ) { }

  ngOnInit() {
    this.authService.currentUser.pipe(
      takeUntil(this.destroy$),
      tap(user => {
        this.currentUser = user;
      }),
      filter(user => !!user)
    ).pipe(
      switchMap((user) => {
        this.isLoadingStats = true;
        return this.routeService.loadRoutes(user!.id).pipe(
          takeUntil(this.destroy$)
        );
      })
    ).subscribe({
      next: (routes) => {
        this.calculateAndDisplayStats(routes || []);
        this.isLoadingStats = false;
      },
      error: (err) => {
        console.error('Ошибка загрузки статистики:', err);
        this.isLoadingStats = false;
        this.stats = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculateAndDisplayStats(routes: LoadRoute[]): void {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const lastMonthRoutes = routes.filter(route => {
      const createdAt = route.createdAt instanceof Date ? route.createdAt : (route.createdAt as any).toDate();
      return createdAt >= startOfLastMonth && createdAt < startOfCurrentMonth;
    });

    const allTimeStats = this.aggregateStats(routes);
    const lastMonthStats = this.aggregateStats(lastMonthRoutes);

    this.stats = [
      {
        label: 'Количество сохраненных маршрутов',
        lastMonth: lastMonthRoutes.length,
        allTime: routes.length
      },
      {
        label: 'Общая дистанция',
        lastMonth: this.formatDistance(lastMonthStats.totalDistanceKm),
        allTime: this.formatDistance(allTimeStats.totalDistanceKm)
      },
      {
        label: 'Общее расстояние (на авто)',
        lastMonth: this.formatDistance(lastMonthStats.carDistanceKm),
        allTime: this.formatDistance(allTimeStats.carDistanceKm)
      },
      {
        label: 'Общее расстояние (пешком)',
        lastMonth: this.formatDistance(lastMonthStats.footDistanceKm),
        allTime: this.formatDistance(allTimeStats.footDistanceKm)
      },
      {
        label: 'Общее расстояние (на велосипеде)',
        lastMonth: this.formatDistance(lastMonthStats.bikeDistanceKm),
        allTime: this.formatDistance(allTimeStats.bikeDistanceKm)
      },
      {
        label: 'Суммарное время в пути',
        lastMonth: timeFormat(lastMonthStats.totalDurationSeconds),
        allTime: timeFormat(allTimeStats.totalDurationSeconds)
      }
    ];
  }

  private aggregateStats(routes: LoadRoute[]): {
    totalDistanceKm: number;
    carDistanceKm: number;
    footDistanceKm: number;
    bikeDistanceKm: number;
    totalDurationSeconds: number;
  } {
    let totalDistanceMeters = 0;
    let carDistanceMeters = 0;
    let footDistanceMeters = 0;
    let bikeDistanceMeters = 0;
    let totalDurationSeconds = 0;

    routes.forEach(route => {
      const distance = typeof route.distance === 'number' ? route.distance : 0;
      const duration = typeof route.duration === 'number' ? route.duration : 0;

      totalDistanceMeters += distance;
      totalDurationSeconds += duration;

      switch (route.mode) {
        case 'car':
          carDistanceMeters += distance;
          break;
        case 'foot':
          footDistanceMeters += distance;
          break;
        case 'bike':
          bikeDistanceMeters += distance;
          break;
        default:
          break;
      }
    });

    return {
      totalDistanceKm: totalDistanceMeters / 1000,
      carDistanceKm: carDistanceMeters / 1000,
      footDistanceKm: footDistanceMeters / 1000,
      bikeDistanceKm: bikeDistanceMeters / 1000,
      totalDurationSeconds: totalDurationSeconds
    };
  }

  private formatDistance(distanceKm: number): string {
    if (distanceKm < 0.01) {
      return '0 км';
    }
    return `${distanceKm.toFixed(2)} км`;
  }
}