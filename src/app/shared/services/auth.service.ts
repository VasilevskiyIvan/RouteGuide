import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, user, User as FirebaseAuthUser } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, of, switchMap, map, catchError, tap, shareReplay } from 'rxjs';
import { User } from '../interfaces/user-interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser: Observable<User | null>;

  constructor(private auth: Auth, private firestore: Firestore) {
    this.currentUser = user(this.auth).pipe(
      switchMap(firebaseUser => {
        if (firebaseUser) {
          return from(this.getUserProfileFromFirestore(firebaseUser.uid)).pipe(
            catchError(err => {
              console.error('Ошибка профиля из Firestore:', err);
              return of(null);
            })
          );
        } else {
          return of(null);
        }
      }),
      catchError(err => {
        console.error('Ошибка в AuthService:', err);
        return of(null);
      }),
      shareReplay(1),
      tap(user => {
           this._currentUserSubject.next(user);
           if (user) {
             localStorage.setItem('currentUserId', user.id);
           } else {
             localStorage.removeItem('currentUserId');
           }
       })
    );

    this.currentUser.subscribe();
  }

  login(email: string, password: string): Observable<User | null> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(userCredential => {
        if (userCredential && userCredential.user) {
          return from(this.getUserProfileFromFirestore(userCredential.user.uid));
        } else {
          return of(null);
        }
      }),
      catchError(error => {
        console.error('Ошибка входа:', error.message);
        return of(null);
      })
    );
  }

  register(email: string, password: string, username: string): Observable<User | null> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async userCredential => {
        const firebaseUser = userCredential.user;
        const userId = firebaseUser.uid;
        const userDocRef = doc(this.firestore, `users/${userId}`);
        const newUserDocData: Omit<User, 'id'> = {
          username: username,
          description: '',
          avatarUrl: ''
        };
        await setDoc(userDocRef, newUserDocData);
        return { id: userId, ...newUserDocData } as User;
      }),
      catchError(error => {
        console.error('Ошибка регистрации:', error.message);
        return of(null);
      })
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      catchError(error => {
        console.error('Ошибка выхода:', error.message);
        return of(undefined);
      })
    );
  }

  isLoggedIn(): Observable<boolean> {
    return this.currentUser.pipe(map(user => !!user));
  }

  getCurrentUserId(): string | null {
    return this._currentUserSubject.value?.id || null;
  }

  getUserById(id: string): Observable<User | null> {
    const userDocRef = doc(this.firestore, `users/${id}`);
    return from(getDoc(userDocRef)).pipe(
      map(userSnapshot => {
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data() as Omit<User, 'id'>;
          return { id: userSnapshot.id, ...userData } as User;
        } else {
          console.warn('Пользователь не найден для ID:', id);
          return null;
        }
      }),
      catchError(err => {
        console.error('Ошибка получения пользователя:', err);
        return of(null);
      })
    );
  }

  private async getUserProfileFromFirestore(uid: string): Promise<User | null> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    const userSnapshot = await getDoc(userDocRef);
    if (userSnapshot.exists()) {
      const userData = userSnapshot.data() as Omit<User, 'id'>;
      return { id: userSnapshot.id, ...userData };
    } else {
      console.warn('Профиль не найден для UID:', uid);
      return null;
    }
  }
}