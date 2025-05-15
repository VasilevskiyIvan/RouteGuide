import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service'; // Проверь путь
import { Router } from '@angular/router';
import { User } from '../../shared/interfaces/user'; // Импортируем User для типизации (хотя напрямую не используется в шаблоне)

@Component({
  selector: 'login-page',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  // Используем email вместо username для логина в Firebase Auth
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {
    console.log('LoginPageComponent создан');
  }

  onSubmit(): void {
    console.log('Попытка логина с email:', this.email);
    // Простая валидация полей перед отправкой
    if (!this.email || !this.password) {
      alert('Пожалуйста, введите email и пароль.');
      return;
    }

    // Вызываем метод логина из AuthService, передавая email и password
    // AuthService.login возвращает Observable<User | null>
    this.authService.login(this.email, this.password).subscribe({
      next: (user: User | null) => { // Явно указываем тип user
        if (user) {
          console.log('Логин успешен, пользователь UID:', user.id, 'переход на /profile');
          this.router.navigate(['/profile']);
        } else {
          // AuthService уже выводит в консоль ошибки Firebase Auth
          // Здесь показываем общее сообщение об ошибке
          alert('Неверный email или пароль. Пожалуйста, попробуйте снова.');
        }
      },
      error: (err) => {
        // Ловим необработанные ошибки из сервиса (если есть)
        console.error('Ошибка при логине:', err);
        alert('Произошла ошибка при попытке входа.');
      }
    });
  }
}