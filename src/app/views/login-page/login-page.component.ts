import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';
import { User } from '../../shared/interfaces/user';

@Component({
  selector: 'login-page',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      alert('Введите email и пароль.');
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (user: User | null) => {
        if (user) {
          this.router.navigate(['/profile']);
        } else {
          alert('Неверный email или пароль.');
        }
      },
      error: (err) => {
        console.error('Ошибка входа:', err);
        alert('Ошибка при входе.');
      }
    });
  }
}