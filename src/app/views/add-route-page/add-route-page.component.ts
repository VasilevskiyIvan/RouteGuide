import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { RouteService } from '../../shared/services/route.service';
import { MapComponent } from '../../shared/map/map.component';
import { CommonModule, DatePipe } from '@angular/common'; // Добавляем DatePipe, если он используется в шаблоне
import { FormsModule } from '@angular/forms';
import { RouteInfo } from '../../shared/interfaces/route-info-inteface'; // Проверь путь к интерфейсу
import { RouteInfoComponent } from '../../shared/route-info/route-info.component';
import { AuthService } from '../../shared/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../../shared/interfaces/user'; // Проверь путь к интерфейсу


@Component({
  selector: 'app-add-route-page',
  standalone: true,
  imports: [MapComponent, CommonModule, FormsModule, RouteInfoComponent], // Убедись, что все standalone компоненты импортированы
  // providers: [DatePipe], // DatePipe обычно предоставляется в корне или в CommonModule
  templateUrl: './add-route-page.component.html',
  styleUrl: './add-route-page.component.scss'
})
export class AddRoutePageComponent implements OnInit, OnDestroy {
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  public startAddress = '';
  public endAddress = '';
  public mode = 'car';
  public routeInfo?: RouteInfo;

  // currentRoute должен содержать все данные, которые ты хочешь сохранить в Firestore
  private currentRoute: any; // Можешь применить более строгий тип, например SavedRoute, если определил его полностью

  public currentUser: User | null = null; // Получаем текущего пользователя через AuthService

  private destroy$ = new Subject<void>();

  constructor(
    private routeService: RouteService,
    private authService: AuthService,
    private router: Router
  ) {
    console.log('AddRoutePageComponent создан');
  }

  ngOnInit(): void {
    console.log('AddRoutePageComponent OnInit');
    // Подписываемся на currentUser из AuthService
    this.authService.currentUser.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      console.log('Текущий пользователь на странице AddRoute:', this.currentUser?.username, 'UID:', this.currentUser?.id);
      // Можно добавить редирект на страницу логина, если пользователь не авторизован
      // if (!user) {
      //     this.router.navigate(['/login']);
      // }
    });
  }

  ngOnDestroy(): void {
    console.log('AddRoutePageComponent OnDestroy');
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStartAddressChange(value: string) {
    this.startAddress = value;
    console.log('В род. компоненте изменился стартовый адрес: ', value);
  }

  onEndAddressChange(value: string) {
    this.endAddress = value;
    console.log('В род. компоненте изменился конечный адрес: ', value);
  }

  onModeChange(value: string) {
    this.mode = value;
    console.log('В род. компоненте изменился тип транспорта: ', value);
  }

  async calculateRoute(): Promise<void> {
    console.log('Запущен расчет маршрута...');
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
      alert('Ошибка при построении маршрута. Проверьте правильность адресов.');
      console.error('Ошибка расчета маршрута:', error);
    }
  }

  private processRouteData(route: any): void {
    console.log('Обработка данных маршрута...');
    this.mapComponent.drawRoute(route);

    // Сохраняем все данные маршрута для последующего сохранения
    this.currentRoute = route;
    // Добавляем адреса и режим к объекту маршрута, чтобы сохранить их вместе с геометрией и т.д.
    this.currentRoute.startAddress = this.startAddress;
    this.currentRoute.endAddress = this.endAddress;
    this.currentRoute.mode = this.mode;

    // Обновляем routeInfo для отображения на странице
    if (route && route.routes && route.routes[0] && route.routes[0].duration !== undefined && route.routes[0].distance !== undefined) {
      this.routeInfo = {
        from: this.startAddress,
        to: this.endAddress,
        time: this.timeFormat(route.routes[0].duration),
        distance: `${(route.routes[0].distance / 1000).toFixed(2)} км`
      };
    } else {
      console.warn('Не удалось получить полную информацию о маршруте (duration/distance).');
      this.routeInfo = {
        from: this.startAddress,
        to: this.endAddress,
        time: 'Н/Д',
        distance: 'Н/Д'
      };
    }
    console.log('Обработка данных маршрута завершена.');
  }

  public saveRoute(): void {
    console.log('Нажата кнопка "Сохранить маршрут".');
    // Проверяем, авторизован ли пользователь и есть ли у него UID
    if (!this.currentUser || !this.currentUser.id) {
      alert('Пожалуйста, войдите в аккаунт, чтобы сохранить маршрут.');
      // Можно добавить автоматический редирект
      this.router.navigate(['/login']);
      return;
    }

    // Проверяем, построен ли маршрут
    if (!this.currentRoute) {
      alert('Сначала постройте маршрут.');
      return;
    }

    // Вызываем saveRoute из RouteService, передавая объект маршрута и UID пользователя
    this.routeService.saveRoute(this.currentRoute, this.currentUser.id).pipe(takeUntil(this.destroy$)).subscribe(
      // Можно добавить обработку успешного сохранения здесь, если нужно
      // Например:
      // {
      //     next: (docRef) => console.log('Маршрут успешно сохранен, ID:', docRef?.id),
      //     error: (err) => console.error('Ошибка при сохранении в компоненте:', err)
      // }
    );
  }

  private timeFormat(time: number | undefined | null): string { // Указываем возможные типы для time
    if (time === undefined || time === null || isNaN(time)) return `Не удается определить время`;

    let days = Math.floor(time / 86400);
    let hours = Math.floor((time % 86400) / 3600);
    let mins = Math.floor((time % 3600) / 60);
    let secs = Math.floor((time % 60) / 1);

    let parts: string[] = [];
    if (days > 0) parts.push(`${days} д`); // Добавляем проверку > 0
    if (hours > 0) parts.push(`${hours} ч`); // Добавляем проверку > 0
    if (mins > 0) parts.push(`${mins} мин`); // Добавляем проверку > 0
    // Секунды показываем, только если нет более крупных единиц и они > 0
    if (secs > 0 && parts.length === 0) parts.push(`${secs} сек`);


    return parts.length > 0 ? parts.join(' ') : `Менее минуты`; // Если все 0, показываем "Менее минуты"
  }

  public position() {
    alert('Функционал определения позиции еще не полностью реализован для этой страницы.');
  }
}