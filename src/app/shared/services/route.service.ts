// src/app/shared/services/route.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, map } from 'rxjs/operators';
import { Observable, from, of, firstValueFrom } from 'rxjs';

// Импорты для Firestore
import { Firestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy } from '@angular/fire/firestore';

// *** ИСПРАВЛЕНИЕ: Импортируем оба новых интерфейса ***
import { SavedRouteInDb, LoadedRoute } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private nom_url = 'https://nominatim.openstreetmap.org/search';
  private osrm_template_url = 'https://routing.openstreetmap.de/routed-';

  constructor(private http: HttpClient, private firestore: Firestore) {
    console.log('RouteService создан');
  }

  // Методы geocode и getRoute остаются без изменений
  async geocode(address: string): Promise<[number, number]> {
    const url = `${this.nom_url}?format=json&q=${encodeURIComponent(address)}`;
    console.log('Запрос геокодирования:', url);
    try {
      const response: any = await firstValueFrom(this.http.get<any[]>(url));
      console.log('Ответ геокодирования:', response);
      if (response && response.length > 0) {
        return [parseFloat(response[0].lat), parseFloat(response[0].lon)];
      } else {
        console.log('Адрес не найден:', address);
        throw new Error('Адрес не найден');
      }
    } catch (error) {
      console.error('Ошибка геокодирования:', error);
      throw error;
    }
  }

  async getRoute(start: [number, number], end: [number, number], mode: string): Promise<any> {
    const profile = this.getMode(mode);
    const coords = `${start[1]},${start[0]};${end[1]},${end[0]}`;
    const url = `${this.osrm_template_url}${profile}/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=true`;
    console.log('Запрос маршрута:', url);
    try {
      const response: any = await firstValueFrom(this.http.get(url));
      console.log('Ответ маршрута:', response);
      return response;
    } catch (error) {
      console.error('Ошибка при получении маршрута:', error);
      throw error;
    }
  }

  // Сохранение маршрута в Firestore
  // На вход получаем объект, похожий на LoadedRoute (или просто any), но сохраняем как SavedRouteInDb
  public saveRoute(route: any, userId: string): Observable<any> {
    console.log('Попытка сохранения маршрута для пользователя:', userId, 'данные:', route);
    if (!userId) {
      console.error('Попытка сохранения маршрута без userId.');
      alert('Ошибка: Не удалось определить пользователя для сохранения маршрута.');
      return of(null);
    }

    const routesCollectionRef = collection(this.firestore, 'routes');

    let routesJsonString = null;
    let waypointsJsonString = null;

    try {
      if (route.routes) {
        routesJsonString = JSON.stringify(route.routes);
      }
      if (route.waypoints) {
        waypointsJsonString = JSON.stringify(route.waypoints);
      }
    } catch (e) {
      console.error('Ошибка сериализации данных маршрута в JSON:', e);
      alert('Ошибка при подготовке данных маршрута к сохранению.');
      return of(null);
    }

    // *** ИСПРАВЛЕНИЕ: Формируем объект типа SavedRouteInDb для сохранения ***
    const routeToSave: Omit<SavedRouteInDb, 'id'> = {
      userId: userId,
      createdAt: new Date(),
      startAddress: route.startAddress,
      endAddress: route.endAddress,
      mode: route.mode,
      routesJson: routesJsonString, // Сохраняем JSON строку
      waypointsJson: waypointsJsonString, // Сохраняем JSON строку
      duration: route.routes?.[0]?.duration, // Сохраняем простые поля, если есть
      distance: route.routes?.[0]?.distance
    };

    return from(addDoc(routesCollectionRef, routeToSave)).pipe(
      tap((docRef) => {
        console.log('Маршрут успешно сохранен в Firestore с ID:', docRef.id, 'для пользователя', userId);
        alert('Маршрут сохранён');
      }),
      catchError((err) => {
        console.error('Ошибка при сохранении маршрута в Firestore:', err);
        alert('Вышла ошибка при сохранении');
        return of(null);
      })
    );
  }

  // Загрузка маршрутов пользователя из Firestore
  // *** ИСПРАВЛЕНИЕ: Изменяем тип возвращаемого значения на Observable<LoadedRoute[]> ***
  public loadRoutes(userId: string): Observable<LoadedRoute[]> {
    console.log('Попытка загрузки маршрутов для пользователя:', userId);
    if (!userId) {
      console.warn('Попытка загрузки маршрутов без userId.');
      return of([]);
    }

    const routesCollectionRef = collection(this.firestore, 'routes');
    const q = query(routesCollectionRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

    return from(getDocs(q)).pipe(
      map(querySnapshot => {
        // *** ИСПРАВЛЕНИЕ: Создаем массив типа LoadedRoute[] ***
        const loadedRoutes: LoadedRoute[] = [];
        querySnapshot.forEach((doc) => {
          // *** ИСПРАВЛЕНИЕ: Читаем данные как SavedRouteInDb (без ID) ***
          const data = doc.data() as Omit<SavedRouteInDb, 'id'>; // Данные как они в базе

          // Парсим JSON строки
          let parsedRoutes = null;
          let parsedWaypoints = null;

          try {
            if (data.routesJson && typeof data.routesJson === 'string') {
              parsedRoutes = JSON.parse(data.routesJson);
            }
            if (data.waypointsJson && typeof data.waypointsJson === 'string') {
              parsedWaypoints = JSON.parse(data.waypointsJson);
            }
          } catch (e) {
            console.error('Ошибка парсинга JSON данных маршрута:', doc.id, e);
            // Пропускаем документ с ошибкой парсинга
            return; // Использование `return` в forEach пропускает текущую итерацию
          }

          // *** ИСПРАВЛЕНИЕ: Формируем объект типа LoadedRoute ***
          const loadedRoute: LoadedRoute = {
            id: doc.id, // ID документа из базы
            userId: data.userId,
            createdAt: data.createdAt, // @angular/fire обычно сам конвертирует Timestamp в Date
            startAddress: data.startAddress,
            endAddress: data.endAddress,
            mode: data.mode,
            // Присваиваем РАСПАРСЕННЫЕ объекты/массивы
            routes: parsedRoutes,
            waypoints: parsedWaypoints,
            // Копируем другие простые поля
            duration: data.duration,
            distance: data.distance
            // НЕ включаем сюда routesJson и waypointsJson, т.к. они не нужны после парсинга в приложении
          };

          loadedRoutes.push(loadedRoute); // Добавляем объект типа LoadedRoute в массив
        });
        console.log('Маршруты получены и распарсены из Firestore для пользователя', userId, ':', loadedRoutes.length);
        return loadedRoutes; // Возвращаем массив объектов типа LoadedRoute
      }),
      catchError(err => {
        console.error('Ошибка при загрузке или парсинге маршрутов из Firestore:', err);
        return of([]);
      })
    );
  }

  // Метод deleteRoute остается без изменений, т.к. работает по ID документа
  public deleteRoute(routeId: string): Observable<void> {
    console.log('Попытка удаления маршрута:', routeId);
    if (!routeId) {
      console.warn('Попытка удаления маршрута без routeId.');
      return of(undefined);
    }

    const routeDocRef = doc(this.firestore, `routes/${routeId}`);

    return from(deleteDoc(routeDocRef)).pipe(
      tap(() => {
        console.log('Маршрут успешно удален из Firestore:', routeId);
      }),
      catchError((err) => {
        console.error('Ошибка удаления маршрута из Firestore:', routeId, err);
        alert('Ошибка при удалении маршрута.');
        return of(undefined);
      })
    );
  }

  private getMode(mode: string): string {
    switch (mode) {
      case 'foot': return 'foot';
      case 'bike': return 'bike';
      default: return 'car';
    }
  }
}