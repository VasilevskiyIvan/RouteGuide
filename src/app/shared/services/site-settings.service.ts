import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class SiteSettingsService {
  constructor(private firestore: Firestore) { }

  public getSiteSettings(): Observable<any | null> {
    const settingsDocRef = doc(this.firestore, 'settings/siteInfo');
    return from(getDoc(settingsDocRef)).pipe(
      map(docSnapshot => {
        if (docSnapshot.exists()) {
          return docSnapshot.data();
        } else {
          console.warn('Настройки сайта не найдены.');
          return null;
        }
      }),
      catchError((err) => {
        console.error('Ошибка получения настроек сайта:', err);
        return of(null);
      })
    );
  }
}