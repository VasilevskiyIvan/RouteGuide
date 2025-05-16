import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, map } from 'rxjs/operators';
import { Observable, from, of, firstValueFrom } from 'rxjs';
import { Firestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy } from '@angular/fire/firestore';
import { SaveRoute, LoadRoute } from '../interfaces/route-server-interface';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private nom_url = 'https://nominatim.openstreetmap.org/search';
  private osrm_template_url = 'https://routing.openstreetmap.de/routed-';

  constructor(private http: HttpClient, private firestore: Firestore) { }

  async geocode(address: string): Promise<[number, number]> {
    const url = `${this.nom_url}?format=json&q=${encodeURIComponent(address)}`;
    try {
      const response: any = await firstValueFrom(this.http.get<any[]>(url));
      if (response && response.length > 0) {
        return [parseFloat(response[0].lat), parseFloat(response[0].lon)];
      } else {
        console.warn('Адрес не найден:', address);
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
    try {
      const response: any = await firstValueFrom(this.http.get(url));
      return response;
    } catch (error) {
      console.error('Ошибка получения маршрута:', error);
      throw error;
    }
  }

  public saveRoute(route: any, userId: string): Observable<any> {
    if (!userId) {
      console.error('Отсутствует userId для сохранения маршрута.');
      alert('Ошибка: Не удалось определить пользователя.');
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
      console.error('Ошибка сериализации маршрута:', e);
      alert('Ошибка подготовки данных маршрута.');
      return of(null);
    }

    const routeToSave: Omit<SaveRoute, 'id'> = {
      userId: userId,
      createdAt: new Date(),
      startAddress: route.startAddress,
      endAddress: route.endAddress,
      mode: route.mode,
      routesJson: routesJsonString,
      waypointsJson: waypointsJsonString,
      duration: route.routes?.[0]?.duration,
      distance: route.routes?.[0]?.distance
    };

    return from(addDoc(routesCollectionRef, routeToSave)).pipe(
      tap(() => alert('Маршрут сохранён')),
      catchError((err) => {
        console.error('Ошибка сохранения маршрута:', err);
        alert('Ошибка при сохранении маршрута.');
        return of(null);
      })
    );
  }

  public loadRoutes(userId: string): Observable<LoadRoute[]> {
    if (!userId) {
      console.warn('Отсутствует userId для загрузки маршрутов.');
      return of([]);
    }

    const routesCollectionRef = collection(this.firestore, 'routes');
    const q = query(routesCollectionRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

    return from(getDocs(q)).pipe(
      map(querySnapshot => {
        const loadedRoutes: LoadRoute[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<SaveRoute, 'id'>;
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
            console.error('Ошибка парсинга данных маршрута:', doc.id, e);
            return;
          }

          const loadedRoute: LoadRoute = {
            id: doc.id,
            userId: data.userId,
            createdAt: data.createdAt,
            startAddress: data.startAddress,
            endAddress: data.endAddress,
            mode: data.mode,
            routes: parsedRoutes,
            waypoints: parsedWaypoints,
            duration: data.duration,
            distance: data.distance
          };

          loadedRoutes.push(loadedRoute);
        });
        return loadedRoutes;
      }),
      catchError(err => {
        console.error('Ошибка загрузки маршрутов:', err);
        return of([]);
      })
    );
  }

  public deleteRoute(routeId: string): Observable<void> {
    if (!routeId) {
      console.warn('Отсутствует routeId для удаления маршрута.');
      return of(undefined);
    }

    const routeDocRef = doc(this.firestore, `routes/${routeId}`);

    return from(deleteDoc(routeDocRef)).pipe(
      catchError((err) => {
        console.error('Ошибка удаления маршрута:', err);
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