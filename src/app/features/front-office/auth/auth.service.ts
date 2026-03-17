import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {
    // Check localStorage for existing session
    this.loadSession();
  }

  login(email: string, password: string): Promise<boolean> {
    console.log('AuthService.login called with email:', email);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Creating user object...');
        // Mock user - accept any email with password
        const user: User = {
          id: '1',
          email: email,
          name: email.split('@')[0],
          role: 'user'
        };
        console.log('User created:', user);
        this.currentUser.set(user);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('User saved, navigating to dashboard...');
        this.router.navigate(['/dashboard']);
        resolve(true);
      }, 1000);
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
