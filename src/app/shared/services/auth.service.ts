// src/app/shared/services/auth.service.ts
import { Injectable } from '@angular/core';
// Убираем HttpClient, of, catchError
// import { HttpClient } from '@angular/common/http';

// Новые импорты для Firebase Auth и Firestore
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, user, User as FirebaseAuthUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

// Переносим импорты RxJS и добавляем нужные операторы
import { Observable, from, of, BehaviorSubject, switchMap, map, catchError, tap } from 'rxjs';

import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private apiUrl = 'http://localhost:3000'; // Удаляем - больше не нужен

  // BehaviorSubject для отслеживания текущего пользователя в приложении
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  // Публичный Observable, на который подписываются компоненты
  public currentUser: Observable<User | null> = this.currentUserSubject.asObservable();

  // Инжектируем сервисы Auth и Firestore из @angular/fire
  constructor(private auth: Auth, private firestore: Firestore) {
    console.log('AuthService создан');

    // Подписываемся на состояние пользователя Firebase Auth
    // user() - это Observable, который эмитит Firebase Auth пользователя при изменении его состояния (логин, логаут, инициализация)
    user(this.auth).pipe(
      // switchMap используется для переключения на новый Observable (получение данных профиля из Firestore)
      // каждый раз, когда user(this.auth) эмитит новое значение
      switchMap(firebaseUser => {
        console.log('Firebase Auth user state changed:', firebaseUser?.uid);
        if (firebaseUser) {
          // Если есть Firebase Auth пользователь, пытаемся получить его данные профиля из Firestore
          return from(this.getUserProfileFromFirestore(firebaseUser.uid)).pipe(
            // Обрабатываем ошибку получения профиля, если документ в Firestore отсутствует
            catchError(err => {
              console.error('Ошибка при получении профиля пользователя из Firestore:', firebaseUser.uid, err);
              // Если профиль не найден или ошибка, возвращаем null
              // Возможно, здесь стоит добавить логику создания профиля, если его нет
              return of(null);
            })
          );
        } else {
          // Если нет Firebase Auth пользователя (разлогинен), возвращаем Observable с null
          return of(null);
        }
      }),
      // catchError здесь ловит ошибки из switchMap, но логика обработки уже внутри
      catchError(err => {
        console.error('Неожиданная ошибка в AuthState Observable:', err);
        this.logout(); // На всякий случай выполняем логаут в приложении
        return of(null); // Возвращаем Observable с null, чтобы поток не прервался
      })
    )
      // Подписываемся на окончательный Observable и обновляем currentUserSubject
      .subscribe(user => {
        console.log('Обновление currentUserSubject:', user ? user.id : 'null');
        this.currentUserSubject.next(user); // Обновляем BehaviorSubject

        // Опционально: синхронизация localStorage
        if (user) {
          localStorage.setItem('currentUserId', user.id); // Храним UID
        } else {
          localStorage.removeItem('currentUserId');
        }
      });

    // Логика с localStorage при старте приложения теперь полностью заменена
    // подпиской на user(this.auth) в конструкторе
    // const userId = localStorage.getItem('currentUserId');
    // if (userId) {
    //   this.getUserById(userId).pipe(...) // Этот код больше не нужен здесь
    // }
  }

  // src/app/shared/services/auth.service.ts (фрагмент метода login)

  // Метод логина с использованием Firebase Auth (принимает email и password)
  login(email: string, password: string): Observable<User | null> {
    console.log('Попытка логина для email:', email);
    // signInWithEmailAndPassword возвращает Promise, from() конвертирует его в Observable
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      // *** ИСПРАВЛЕНИЕ: Добавляем map для преобразования UserCredential в User | null ***
      switchMap(userCredential => {
        // Если логин успешен, userCredential.user - это Firebase Auth User объект
        // Используем его uid для получения данных профиля из Firestore
        if (userCredential && userCredential.user) {
          // Возвращаем Observable от getUserProfileFromFirestore
          return from(this.getUserProfileFromFirestore(userCredential.user.uid));
        } else {
          // Если userCredential или user почему-то null/undefined (чего в норме не происходит при успешном signIn),
          // или если signInWithEmailAndPassword вернул ошибку, catchError ниже ее поймает
          return of(null);
        }
      }),
      // tap здесь сработает уже после switchMap, получая User | null
      tap(user => {
        if (user) {
          console.log('Firebase Auth login successful, user profile:', user.id);
          // Подписка user(this.auth) в конструкторе также получит этого пользователя
          // и обновит currentUserSubject. Можно оставить tap здесь для логгирования.
        } else {
          console.log('Login failed or user profile not found.');
          // Если switchMap вернул null (профиль не найден), можно здесь обработать
          // или полагаться на catchError для ошибок аутентификации.
        }
      }),
      // catchError здесь обрабатывает ошибки из signInWithEmailAndPassword И ИЗ switchMap (getUserProfileFromFirestore)
      catchError(error => {
        console.error('Firebase Auth login error:', error.code, error.message);
        // Обработка ошибок (неверный пароль, пользователь не найден и т.д.)
        // Firebase Error Codes: https://firebase.google.com/docs/auth/admin/errors
        return of(null); // Возвращаем Observable с null при ошибке логина или загрузки профиля
      })
    );
  }

  // ... остальной код AuthService

  // Метод регистрации с использованием Firebase Auth и создание документа профиля в Firestore
  // Принимает email, password и username (который будет сохранен в профиле Firestore)
  register(email: string, password: string, username: string): Observable<User | null> {
    console.log('Попытка регистрации для email:', email, 'username:', username);
    // createUserWithEmailAndPassword возвращает Promise
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      // switchMap для выполнения следующего асинхронного действия (создание документа профиля)
      switchMap(async userCredential => {
        console.log('Firebase Auth registration successful:', userCredential.user.uid);
        const firebaseUser = userCredential.user;
        const userId = firebaseUser.uid; // Получаем UID

        // Ссылка на документ пользователя в коллекции 'users' с ID = UID
        const userDocRef = doc(this.firestore, `users/${userId}`);
        // Данные профиля для сохранения в Firestore (без пароля!)
        const newUserDocData: Omit<User, 'id'> = {
          username: username, // Сохраняем username
          description: '', // Начальные значения
          avatarUrl: ''
          // ... можно добавить другие начальные поля
        };

        // Создаем или перезаписываем документ профиля в Firestore
        await setDoc(userDocRef, newUserDocData);

        console.log('User profile document created in Firestore for UID:', userId);

        // Возвращаем созданного пользователя (объект User с ID)
        return { id: userId, ...newUserDocData } as User;
      }),
      // tap для выполнения побочных эффектов после успешного создания пользователя и профиля
      tap(user => {
        if (user) {
          console.log('Registration and profile creation complete:', user.id);
          // Пользователь уже залогинен автоматически после регистрации в Auth
          // Подписка user(this.auth) обновит currentUserSubject
        }
      }),
      // Обработка ошибок регистрации или создания документа
      catchError(error => {
        console.error('Firebase Auth registration or Firestore document creation error:', error.code, error.message);
        // Например, 'auth/email-already-in-use'
        // Если ошибка произошла после создания пользователя в Auth, но до создания документа в Firestore,
        // возможно, нужно будет удалить пользователя из Auth. Это усложняет логику.
        // Для простоты пока просто возвращаем null.
        return of(null); // Возвращаем null при ошибке
      })
    );
  }

  // Метод получения данных профиля пользователя из Firestore по UID
  // Возвращает Promise<User | null>, используется внутри сервиса
  private async getUserProfileFromFirestore(uid: string): Promise<User | null> {
    if (!uid) {
      console.log('getUserProfileFromFirestore вызван без uid.');
      return null;
    }
    console.log('Попытка получить профиль из Firestore для UID:', uid);
    // Ссылка на документ профиля пользователя
    const userDocRef = doc(this.firestore, `users/${uid}`);
    // Получаем документ один раз
    const userSnapshot = await getDoc(userDocRef);

    if (userSnapshot.exists()) {
      // Если документ существует, получаем данные и добавляем ID (UID)
      const userData = userSnapshot.data() as Omit<User, 'id'>;
      console.log('Профиль пользователя получен из Firestore:', uid, userData);
      return { id: userSnapshot.id, ...userData }; // Возвращаем объект User
    } else {
      console.warn('Документ профиля пользователя не найден в Firestore для UID:', uid);
      // Пользователь аутентифицирован в Auth, но документа профиля в Firestore нет.
      // Это может произойти, если профиль не был создан после регистрации (например, из-за ошибки).
      // Можно добавить логику создания здесь, если это желаемое поведение.
      return null; // Возвращаем null, если профиль не найден
    }
  }


  // Метод выхода из аккаунта
  logout(): Observable<void> {
    console.log('Попытка логаута.');
    // signOut() возвращает Promise
    return from(signOut(this.auth)).pipe(
      tap(() => {
        console.log('Firebase Auth logout successful.');
        // Подписка user(this.auth) сработает и обновит currentUserSubject на null
        // localStorage.removeItem('currentUserId'); // Можно убрать, т.к. SDK управляет
        // this.currentUserSubject.next(null); // Уберем, т.к. это делает подписка user(this.auth)
      }),
      catchError(error => {
        console.error('Firebase Auth logout error:', error.code, error.message);
        // Если Firebase выдал ошибку при логауте, мы все равно сбрасываем состояние в приложении
        // Это помогает избежать застрявшего состояния "залогинен", если логаут на стороне Firebase не удался по тех. причинам
        // localStorage.removeItem('currentUserId'); // Можно убрать
        // this.currentUserSubject.next(null); // Уберем
        return of(undefined); // Возвращаем Observable<void> при ошибке
      })
    );
  }

  // Проверка залогинен ли пользователь
  // Этот метод теперь просто использует Observable currentUser
  isLoggedIn(): Observable<boolean> {
    console.log('Проверка статуса isLoggedIn.');
    return this.currentUser.pipe(map(user => !!user));
  }

  // Получить текущий UID пользователя (синхронно из BehaviorSubject)
  getCurrentUserId(): string | null {
    console.log('Получение текущего UID из BehaviorSubject.');
    // Использовать значение из BehaviorSubject
    return this.currentUserSubject.value?.id || null;
    // Или напрямую из Auth (менее реактивно, если не использовать user Observable)
    // return this.auth.currentUser?.uid || null;
  }

  // Метод getUserById, если он нужен для получения профиля ЛЮБОГО пользователя по UID
  // (например, на странице просмотра профиля другого пользователя)
  // Если нужен только профиль текущего пользователя, этот метод можно удалить,
  // т.к. currentUser Observable предоставляет данные текущего пользователя.
  // Если удаляешь, то в ProfileService тоже нужно будет получить данные через AuthService.currentUser
  getUserById(id: string): Observable<User | null> {
    console.log('Попытка получить пользователя по ID (UID) из Firestore:', id);
    if (!id) {
      console.warn('getUserById вызван без id.');
      return of(null);
    }
    // Ссылка на документ пользователя в коллекции 'users'
    const userDocRef = doc(this.firestore, `users/${id}`);
    // Получаем документ один раз
    return from(getDoc(userDocRef)).pipe(
      map(userSnapshot => {
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data() as Omit<User, 'id'>;
          console.log('Пользователь получен по ID из Firestore:', userSnapshot.id, userData);
          return { id: userSnapshot.id, ...userData } as User; // Возвращаем объект User
        } else {
          console.log(`Документ пользователя с ID ${id} не найден в Firestore.`);
          return null; // Возвращаем null, если не найден
        }
      }),
      catchError(err => {
        console.error('Ошибка при получении пользователя по ID из Firestore:', id, err);
        return of(null); // Возвращаем null при ошибке
      })
    );
  }
}