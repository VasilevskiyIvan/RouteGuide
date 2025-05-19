import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';
import { User } from '../../shared/interfaces/user-interface';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss'
})
export class RegisterPageComponent {
  email = '';
  password = '';
  confirmPassword = '';
  username = '';

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit(): void {
    if (this.password !== this.confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }
    if (!this.email || !this.password || !this.username) {
      alert('Заполните все поля');
      return;
    }

    this.authService.register(this.email, this.password, this.username).subscribe({
      next: (user: User | null) => {
        if (user) {
          this.router.navigate(['/profile']);
        }
      },
      error: (error: any) => {
        console.error('Ошибка регистрации:', error);
        let message = 'Неизвестная ошибка регистрации';

        switch (error.code) {
          case 'auth/invalid-email':
            message = 'Некорректный формат email адреса';
            break;
          case 'auth/email-already-in-use':
            message = 'Email уже используется';
            break;
          case 'auth/weak-password':
            message = 'Пароль слишком короткий или простой';
            break;
          default:
            break;
        }

        alert(message);
      }
    });
  }

  login(): void {
    this.router.navigate(['/login']);
  }
}