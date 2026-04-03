import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { setProfileUserUuid, setLocalDemoMode } from '../profile/profile-user-id';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'recruiter' | 'admin';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    // Check localStorage for existing session
    this.loadSession();
  }

  login(email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const role: User['role'] = email.toLowerCase().includes('admin@') ? 'admin' : 'user';
        const user: User = {
          id: '1',
          email,
          name: email.split('@')[0],
          role,
        };
        this.currentUser.set(user);
        localStorage.setItem('user', JSON.stringify(user));

        const base = environment.userApiUrl.replace(/\/$/, '');
        try {
          const res = await firstValueFrom(
            this.http.get<{ id: string }>(`${base}/users/email/${encodeURIComponent(email)}`)
          );
          if (res?.id) {
            setProfileUserUuid(String(res.id));
            setLocalDemoMode(false);
          }
        } catch {
          setProfileUserUuid(environment.devProfileUserUuid);
        }

        void this.router.navigate(['/dashboard']);
        resolve(true);
      }, 400);
    });
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  getUser(): User | null {
    return this.currentUser();
  }

  getUserId(): string {
    return this.currentUser()?.id || '1';
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  private loadSession(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUser.set(user);
      } catch (e) {
        console.error('Failed to load session:', e);
      }
    }
  }
}
