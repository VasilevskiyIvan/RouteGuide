import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProfileService } from '../../shared/services/profile.service';
import { SiteSettingsService } from '../../shared/services/site-settings.service';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { User } from '../../shared/interfaces/user-interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  public settings!: any;
  public currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private profileService: ProfileService,
    private siteSettings: SiteSettingsService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.siteSettings.getSiteSettings().pipe(takeUntil(this.destroy$)).subscribe({
      next: (settings) => {
        this.settings = settings;
      },
      error: (err) => {
        console.error('Ошибка загрузки настроек сайта:', err);
      }
    });

    this.authService.currentUser.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}