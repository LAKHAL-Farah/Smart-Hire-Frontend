import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ACCOUNT_ROLE_KEY,
  getProfileUserUuid,
  setProfileUserUuid,
  setLocalDemoMode,
} from '../profile/profile-user-id';
import { hasCompletedPreferenceOnboarding } from '../../../core/onboarding-state';
import { ProfileApiService, UserApiResponse } from '../profile/profile-api.service';
import { CandidateAssignmentApiService } from '../assessments/candidate-assignment-api.service';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'recruiter' | 'admin';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUser = signal<User | null>(null);

  constructor(
    private router: Router,
    private http: HttpClient,
    private profileApi: ProfileApiService,
    private assignmentApi: CandidateAssignmentApiService
  ) {
    this.loadSession();
  }

  login(email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      void (async () => {
        const roleGuess: User['role'] = email.toLowerCase().includes('admin@') ? 'admin' : 'user';
        try {
          const base = environment.userApiUrl.replace(/\/$/, '');
          let userId: string | null = null;
          let recruiterFromApi = false;
          try {
            const res = await firstValueFrom(
              this.http.get<UserApiResponse>(`${base}/users/email/${encodeURIComponent(email)}`)
            );
            if (res?.id) {
              userId = String(res.id);
              setProfileUserUuid(userId);
              setLocalDemoMode(false);
              const rn = res.role?.name?.toUpperCase();
              if (rn === 'RECRUITER') {
                recruiterFromApi = true;
                localStorage.setItem(ACCOUNT_ROLE_KEY, 'recruiter');
              } else if (rn === 'CANDIDATE' || rn === 'ADMIN') {
                localStorage.setItem(ACCOUNT_ROLE_KEY, 'candidate');
              }
            }
          } catch {
            setProfileUserUuid(environment.devProfileUserUuid);
          }

          const accountRole = (localStorage.getItem(ACCOUNT_ROLE_KEY) || 'candidate').toLowerCase();
          const user: User = {
            id: userId || getProfileUserUuid(),
            email,
            name: email.split('@')[0],
            role: recruiterFromApi || accountRole === 'recruiter' ? 'recruiter' : roleGuess,
          };
          this.currentUser.set(user);
          localStorage.setItem('user', JSON.stringify(user));

          if (accountRole === 'recruiter' || recruiterFromApi) {
            await this.router.navigate(['/dashboard']);
            resolve(true);
            return;
          }

          try {
            const p = await firstValueFrom(this.profileApi.getProfile(userId ?? undefined));
            if (!hasCompletedPreferenceOnboarding(p.onboardingJson ?? null)) {
              await this.router.navigate(['/onboarding']);
              resolve(true);
              return;
            }
          } catch {
            await this.router.navigate(['/onboarding']);
            resolve(true);
            return;
          }

          const uid = userId ?? getProfileUserUuid();
          try {
            const st = await firstValueFrom(this.assignmentApi.getStatus(uid));
            if (st.status === 'PENDING') {
              await this.router.navigate(['/dashboard/assessments']);
              resolve(true);
              return;
            }
          } catch (e) {
            if (e instanceof HttpErrorResponse && e.status === 404) {
              /* legacy user without assignment row */
            }
          }

          await this.router.navigate(['/dashboard']);
          resolve(true);
        } catch {
          resolve(false);
        }
      })();
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
        const user = JSON.parse(userData) as User;
        this.currentUser.set(user);
      } catch (e) {
        console.error('Failed to load session:', e);
      }
    }
  }
}
