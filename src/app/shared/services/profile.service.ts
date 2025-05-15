// src/app/shared/services/profile.service.ts
import { Injectable } from '@angular/core';
// Убираем HttpClient, catchError, tap
// import { HttpClient } from '@angular/common/http';
// import { catchError, tap } from 'rxjs/operators';

import { Observable, from, of } from 'rxjs'; // Добавляем из RxJS
import { map, catchError, tap } from 'rxjs/operators'; // Добавляем операторы RxJS

import { User } from '../interfaces/user';
import { AuthService } from './auth.service'; // Импортируем AuthService

// Импорты для Firestore (оставляем, если getUserById остался в этом сервисе)
// import { Firestore, doc, getDoc } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  // private apiUrl = 'http://localhost:3000'; // Удаляем

  // Инжектируем AuthService
  constructor(
    // private firestore: Firestore, // Может быть не нужен, если используем AuthService
    private authService: AuthService
    ) {
        console.log('ProfileService создан');
    }

  // Публичный метод для получения профиля (используем метод из AuthService)
  // Если профиль нужен только для текущего пользователя, то этот сервис может быть не нужен,
  // а компонент будет просто подписан на authService.currentUser
  public getUserProfile(userId: string): Observable<User | null> {
      console.log('ProfileService: попытка получить профиль для userId:', userId);
       // Используем метод из AuthService для получения профиля по ID (UID) из Firestore
       return this.authService.getUserById(userId);
  }

  // Если нужна функция обновления профиля:
  // public updateProfile(userId: string, profileData: Partial<Omit<User, 'id'>>): Observable<void> {
  //     if (!userId) return of(undefined);
  //     const userDocRef = doc(this.firestore, `users/${userId}`);
  //     return from(updateDoc(userDocRef, profileData)).pipe(...);
  // }
}