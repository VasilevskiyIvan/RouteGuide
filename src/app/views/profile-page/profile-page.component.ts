import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProfileService } from '../../shared/services/profile.service'; // Проверь путь
import { SiteSettingsService } from '../../shared/services/site-settings.service'; // Проверь путь
import { AuthService } from '../../shared/services/auth.service'; // Проверь путь
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { User } from '../../shared/interfaces/user'; // Проверь путь к интерфейсу
import { Router } from '@angular/router'; // Добавляем Router для редиректа, если пользователь не авторизован

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule], // Убедись, что все standalone компоненты импортированы
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  public settings!: any; // Используем any, т.к. тип настроек не определен
  public currentUser: User | null = null; // Получаем текущего пользователя

  private destroy$ = new Subject<void>();

  constructor(
    private profileService: ProfileService, // Оставляем, если он нужен (например, для обновления профиля)
    private siteSettings: SiteSettingsService,
    private authService: AuthService,
    private router: Router // Инжектируем Router
  ) {
    console.log('ProfilePageComponent создан');
  }

  ngOnInit() {
    console.log('ProfilePageComponent OnInit');
    // Загружаем настройки сайта
    this.siteSettings.getSiteSettings().pipe(takeUntil(this.destroy$)).subscribe({
      next: (settings) => {
        console.log('Настройки получены:', settings);
        this.settings = settings;
      },
      error: (err) => {
        console.error('Ошибка при загрузке настроек сайта:', err);
        // Обработка ошибки загрузки настроек
      }
    });

    // Подписываемся на currentUser из AuthService
    this.authService.currentUser.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user; // Обновляем currentUser в компоненте
      console.log('Текущий пользователь на странице Profile:', this.currentUser?.username, 'UID:', this.currentUser?.id);

      // Если user есть, это значит, что AuthService уже загрузил его профиль из Firestore
      // Теперь данные профиля доступны напрямую в this.currentUser
      // Тебе, возможно, больше не нужно вызывать profileService.getUserProfile здесь,
      // если вся необходимая информация (username, description, avatarUrl)
      // уже содержится в объекте User, который эмитит AuthService.currentUser

      // Если тебе нужны ДОПОЛНИТЕЛЬНЫЕ данные профиля, которых нет в основном объекте User
      // или нужна отдельная логика загрузки/обновления, тогда используй ProfileService:
      // if (user && user.id) {
      //    this.profileService.getUserProfile(user.id).pipe(takeUntil(this.destroy$)).subscribe({
      //     next: (profileData) => {
      //        // Если ProfileService возвращает полные данные, обновляем currentUser компонента
      //        this.currentUser = profileData;
      //        console.log('Данные профиля пользователя получены через ProfileService:', this.currentUser);
      //     },
      //     error: (err) => {
      //         console.error('Ошибка при загрузке профиля через ProfileService:', user.id, err);
      //         // Обработка ошибки загрузки профиля
      //     }
      // });
      //} else {
      //   this.currentUser = null;
      //   console.log('Пользователь не залогинен или вышел.');
      //    // Редирект на страницу логина, если пользователь не авторизован
      //    this.router.navigate(['/login']);
      //}

      // Простая проверка и редирект, если пользователь не авторизован
      if (!user) {
        console.log('Пользователь не авторизован, редирект на /login.');
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    console.log('ProfilePageComponent OnDestroy');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Добавь методы для обновления профиля, если это нужно
  //例如:
  // updateProfile() {
  //   if (this.currentUser && this.currentUser.id) {
  //     const updatedData = { description: 'Новое описание', avatarUrl: 'новая_ссылка' }; // Получи данные из формы
  //     this.profileService.updateProfile(this.currentUser.id, updatedData).subscribe(() => {
  //       console.log('Профиль обновлен');
  //       // AuthService.currentUser должен автоматически обновиться
  //     });
  //   }
  // }
}