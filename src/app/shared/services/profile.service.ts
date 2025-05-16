import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  constructor(private authService: AuthService) {}

  public getUserProfile(userId: string): Observable<User | null> {
    return this.authService.getUserById(userId);
  }
}