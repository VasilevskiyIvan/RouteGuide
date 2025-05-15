import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { RouteService } from '../../shared/services/route.service'; // Проверь путь
import { MapComponent } from '../../shared/map/map.component'; // Проверь путь
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service'; // Проверь путь
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
// *** ИСПРАВЛЕНИЕ: Импортируем User и LoadedRoute ***
import { User, LoadedRoute } from '../../shared/interfaces/user';


@Component({
  selector: 'app-saved-page',
  standalone: true,
  imports: [CommonModule, MapComponent, FormsModule],
  templateUrl: './saved-page.component.html',
  styleUrl: './saved-page.component.scss'
})
export class SavedPageComponent implements OnInit, OnDestroy {
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  constructor(
    private routeService: RouteService,
    private authService: AuthService,
    private router: Router
  ) {
    console.log('SavedPageComponent создан');
  }

  // *** ИСПРАВЛЕНИЕ: Изменяем тип на LoadedRoute[] ***
  public routes: LoadedRoute[] | null = null;
  private allUserRoutes: LoadedRoute[] = [];

  // Поля фильтрации - остаются без изменений
  public filterFrom: string = "";
  public filterTo: string = "";
  public filterTime: string = ""; // Для фильтрации по дате
  public filterMode: string = "";

  public currentUser: User | null = null;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    console.log('SavedPageComponent OnInit');
    this.authService.currentUser.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      console.log('Текущий пользователь на странице Saved:', this.currentUser?.username, 'UID:', this.currentUser?.id);
      if (user && user.id) {
        this.loadRoutes(user.id);
      } else {
        this.routes = [];
        this.allUserRoutes = [];
        console.log('Пользователь не залогинен, маршруты не загружены.');
      }
    });
  }

  ngOnDestroy(): void {
    console.log('SavedPageComponent OnDestroy');
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRoutes(userId: string) {
    console.log('Загрузка маршрутов для пользователя:', userId);
    // RouteService.loadRoutes теперь возвращает Observable<LoadedRoute[]>
    this.routeService.loadRoutes(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (routes) => {
        this.allUserRoutes = routes || [];
        console.log('Маршруты успешно загружены:', this.allUserRoutes.length);
        this.applyFilters();
      },
      error: (err) => {
        console.error('Ошибка при загрузке маршрутов пользователя:', userId, err);
        this.allUserRoutes = [];
        this.routes = [];
        alert('Ошибка при загрузке маршрутов.');
      }
    });
  }

  public applyFilters() {
    console.log('Применение фильтров.');
    if (!this.allUserRoutes) {
      this.routes = [];
      return;
    }

    this.routes = this.allUserRoutes.filter(route => {
      // Логика фильтрации остается прежней, т.к. используемые поля (startAddress, mode, createdAt, duration, distance)
      // присутствуют в интерфейсе LoadedRoute
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
          // Логика работы с датой из предыдущего исправления
          // Убедись, что route.createdAt - это объект Date после загрузки
          let dateToCompare: Date | null = null;

          if (route.createdAt instanceof Date) {
            dateToCompare = route.createdAt;
          }
          else if (route.createdAt && typeof route.createdAt === 'object' && typeof (route.createdAt as any).toDate === 'function') {
            dateToCompare = (route.createdAt as any).toDate();
          }
          else if (typeof route.createdAt === 'string') {
            try {
              dateToCompare = new Date(route.createdAt);
              if (isNaN(dateToCompare.getTime())) {
                dateToCompare = null;
              }
            } catch (e) {
              dateToCompare = null;
            }
          }


          if (!dateToCompare) {
            console.error('Не удалось получить корректный Date объект из:', route.createdAt);
            return false;
          }

          const routeDateString = dateToCompare.toISOString().split('T')[0];
          if (routeDateString !== this.filterTime) {
            return false;
          }

        } catch (e) {
          console.error('Непредвиденная ошибка при форматировании или фильтрации даты:', route.createdAt, e);
          return false;
        }
      }

      return true;
    });
    console.log('Отфильтровано маршрутов:', this.routes.length);
  }

  public resetFilters() {
    console.log('Сброс фильтров.');
    this.filterFrom = "";
    this.filterTo = "";
    this.filterTime = "";
    this.filterMode = "";
    this.routes = this.allUserRoutes;
  }

  // drawRoute принимает LoadedRoute
  public drawRoute(route: LoadedRoute) {
    if (!this.mapComponent) {
      console.error('Компонент карты не доступен!');
      return;
    }
    console.log('Выбран для отрисовки: ', route);
    // Теперь route.routes и route.waypoints - это уже распарсенные объекты/массивы
    if (route && route.waypoints && route.waypoints.length >= 2 && route.waypoints[0].location && route.waypoints[1].location) {
      let start = route.waypoints[0].location.reverse();
      let end = route.waypoints[1].location.reverse();
      console.log('Start: ', start);
      console.log('End: ', end);
      this.mapComponent.addMarkers(start as [number, number], end as [number, number]);
      this.mapComponent.drawRoute(route); // Передаем LoadedRoute
    } else {
      console.error('Не удалось отрисовать маршрут: отсутствуют данные waypoints или location в сохраненном маршруте.');
      alert('Не удалось отрисовать маршрут. Неполные данные.');
    }
  }

  // deleteRoute принимает LoadedRoute, но использует только route.id (строковый ID из базы)
  public deleteRoute(event: Event, route: LoadedRoute) {
    event.stopPropagation();

    console.log('Попытка удаления маршрута:', route.id, 'пользователем:', this.currentUser?.id);

    if (!this.currentUser || !this.currentUser.id) {
      alert('Вы не авторизованы для удаления маршрутов.');
      return;
    }

    if (route.userId !== this.currentUser.id) {
      console.warn('Пользователь пытается удалить чужой маршрут! UID:', this.currentUser.id, 'Владелец маршрута:', route.userId);
      alert('Вы не можете удалить этот маршрут.');
      return;
    }

    this.routeService.deleteRoute(route.id!).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        console.log('Маршрут успешно удален из Firestore:', route.id);
        this.allUserRoutes = this.allUserRoutes.filter(r => r.id !== route.id);
        this.applyFilters();
        alert('Маршрут удален.');
      },
      error: (err) => {
        console.error('Ошибка удаления маршрута из Firestore:', route.id, err);
        alert('Ошибка при удалении маршрута.');
      }
    });
  }
}