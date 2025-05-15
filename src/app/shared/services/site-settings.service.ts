// src/app/shared/services/site-settings.service.ts
import { Injectable } from '@angular/core';
// Убираем HttpClient, catchError, tap
// import { HttpClient } from '@angular/common/http';

// Добавляем from из RxJS
import { Observable, from, of } from 'rxjs';
// Добавляем операторы RxJS
import { map, catchError, tap } from 'rxjs/operators';

// Импорты для Firestore
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class SiteSettingsService {
  // Убираем конструктор с HttpClient
  // constructor(private http: HttpClient) {}

  // Инжектируем Firestore
  constructor(private firestore: Firestore) {
      console.log('SiteSettingsService создан');
  }

  // Получаем настройки сайта из Firestore
  public getSiteSettings(): Observable<any | null> {
    console.log('Попытка получить настройки сайта из Firestore.');
    // Ссылка на конкретный документ 'siteInfo' в коллекции 'settings'
    const settingsDocRef = doc(this.firestore, 'settings/siteInfo');

    // Получаем документ один раз. getDoc возвращает Promise<DocumentSnapshot>.
    // from() конвертирует Promise в Observable.
    return from(getDoc(settingsDocRef)).pipe(
      map(docSnapshot => {
        if (docSnapshot.exists()) {
          // Если документ существует, получаем его данные
          const settingsData = docSnapshot.data();
          console.log('Настройки сайта получены из Firestore: ', settingsData);
          return settingsData; // Возвращаем объект с настройками
        } else {
          console.warn('Документ настроек "settings/siteInfo" не найден в Firestore.');
          // Если документа нет, можно вернуть дефолтные настройки или null
          return null;
        }
      }),
      catchError((err) => {
        console.error('Ошибка при получении настроек сайта из Firestore: ', err);
        return of(null); // Возвращаем null при ошибке
      })
    );
  }
}