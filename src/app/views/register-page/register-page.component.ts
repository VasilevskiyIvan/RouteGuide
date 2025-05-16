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
      alert('Пароли не совпадают.');
      return;
    }
    if (!this.email || !this.password || !this.username) {
      alert('Заполните все поля.');
      return;
    }

    this.authService.register(this.email, this.password, this.username).subscribe({
      next: (user: User | null) => {
        if (user) {
          this.router.navigate(['/profile']);
        } else {
          alert('Ошибка регистрации. Возможно, email уже используется.');
        }
      },
      error: (err) => {
        console.error('Ошибка регистрации:', err);
        alert('Ошибка при регистрации.');
      }
    });
  }

  login(): void {
    this.router.navigate(['/login']);
  }
}