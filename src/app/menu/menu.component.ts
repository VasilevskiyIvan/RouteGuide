import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class LeftMenuComponent implements OnInit {
  public t = false;

  public buttonsContentWithAuth = [
    { path: "", text: "Главная" },
    { path: "profile", text: "Профиль" },
    { path: "add-route", text: "Составить маршрут" },
    { path: "saved", text: "Избранные маршруты" },
  ];

  public buttonsContentWithoutAuth = [
    { path: "login", text: "Войти"},
    { path: "", text: "Главная" }
  ];

  public isLoggedIn$!: Observable<boolean>;

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn();
  }

  navigate(path: string) {
    this.router.navigate([path]);
    this.t = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.t = false;
  }
}