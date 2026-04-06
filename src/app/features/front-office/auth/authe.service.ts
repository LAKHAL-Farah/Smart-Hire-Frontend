import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AutheService {

  private API_URL = 'http://localhost:8080/MS-USER/auth';

  constructor(private http: HttpClient, private router: Router) {}

  login(mail: string, password: string) {
    return this.http.post<any>(`${this.API_URL}/connexion`, {
      mail,
      password
    }).pipe(
      tap(res => {
        localStorage.setItem('auth_token', res.Token);
        localStorage.setItem('UserId', res.UserId);
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
    localStorage.removeItem('UserId');
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