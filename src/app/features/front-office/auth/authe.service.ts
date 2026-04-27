import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { userAuthBaseUrl } from '../../../core/user-api-url';

@Injectable({
  providedIn: 'root'
})
export class AutheService {

  private readonly API_URL = `${userAuthBaseUrl()}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(mail: string, password: string) {
    return this.http.post<any>(`${this.API_URL}/connexion`, {
      mail,
      password
    }).pipe(
      tap(res => {
        localStorage.setItem('auth_token', res.Token);
        localStorage.setItem('access_token', res.Token);
        localStorage.setItem('UserId', String(res.UserId ?? ''));
        localStorage.setItem('userId', String(res.UserId ?? ''));
        localStorage.setItem('user_id', String(res.UserId ?? ''));
        localStorage.setItem('uid', String(res.UserId ?? ''));
        localStorage.setItem('userName', res.userName);
        localStorage.setItem('email', res.email);
        localStorage.setItem('role', res.roles);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('UserId');
    localStorage.removeItem('userId');
    localStorage.removeItem('user_id');
    localStorage.removeItem('uid');
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  redirectAfterLogin(): void {
    const role = localStorage.getItem('role');
    if (role === 'recruiter') {
      void this.router.navigate(['/admin']);
    } else {
      void this.router.navigate(['/dashboard']);
    }
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
}