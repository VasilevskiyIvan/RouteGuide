import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service'; // Проверь путь
import { Router } from '@angular/router';
import { User } from '../../shared/interfaces/user'; // Импортируем User

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register-page.component.html', // Проверь, что имя файла правильное
  styleUrl: './register-page.component.scss'
})
export class RegisterPageComponent {
  // Используем email для регистрации в Auth
  email = '';
  password = '';
  confirmPassword = '';
  // Дополнительное поле username для сохранения в профиле Firestore
  username = '';

  constructor(private authService: AuthService, private router: Router) {
    console.log('RegisterPageComponent создан');
  }

  onSubmit(): void {
    console.log('Попытка регистрации с email:', this.email, 'username:', this.username);

    // Простая валидация полей
    if (this.password !== this.confirmPassword) {
      alert('Пароли не совпадают!');
      return;
    }
    if (!this.email || !this.password || !this.username) {
      alert('Пожалуйста, заполните все поля: Email, Имя пользователя и Пароль.');
      return;
    }
    // Можно добавить валидацию формата email, длины пароля и т.д.

    // Вызываем метод регистрации из AuthService, передавая email, password и username
    // AuthService.register возвращает Observable<User | null>
    this.authService.register(this.email, this.password, this.username).subscribe({
      next: (user: User | null) => { // Явно указываем тип user
        if (user) {
          console.log('Регистрация успешна, пользователь UID:', user.id, 'переход на /profile');
          // При успешной регистрации AuthService также выполняет логин
          this.router.navigate(['/profile']);
        } else {
          // AuthService уже выводит в консоль ошибки Firebase Auth
          // Здесь показываем общее сообщение об ошибке (например, email уже используется)
          alert('Ошибка регистрации. Возможно, пользователь с таким email уже существует или введены некорректные данные.');
        }
      },
      error: (err) => {
        // Ловим необработанные ошибки из сервиса (если есть)
        console.error('Ошибка при регистрации:', err);
        alert('Произошла ошибка при попытке регистрации.');
      }
    });
  }
}