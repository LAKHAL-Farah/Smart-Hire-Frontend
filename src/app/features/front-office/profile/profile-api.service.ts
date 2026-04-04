import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { getProfileUserUuid, isLocalDemoMode, setLocalDemoMode } from './profile-user-id';

const LOCAL_PROFILE_KEY = 'smarthire_local_profile';

export interface ProfileApiResponse {
  userId: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  email?: string;
  onboardingJson?: string | null;
}

export interface UserApiResponse {
  id: string;
  email: string;
  status?: string;
  role?: { id?: string; name?: string };
}

export interface OnboardingCompletePayload {
  situation: string;
  careerPath: string;
  answers?: string[];
  skillScores?: Record<string, number>;
  developmentPlanNotes?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly base = environment.userApiUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  getProfile(userId?: string): Observable<ProfileApiResponse> {
    const id = userId ?? getProfileUserUuid();
    if (isLocalDemoMode()) {
      return of(this.readLocalProfile(id));
    }
    return this.http.get<ProfileApiResponse>(`${this.base}/profiles/user/${id}`).pipe(
      catchError((err) => {
        if (environment.localAuthFallback && this.hasLocalProfileFor(id)) {
          return of(this.readLocalProfile(id));
        }
        return throwError(() => err);
      })
    );
  }

  completeOnboarding(body: OnboardingCompletePayload, userId?: string): Observable<ProfileApiResponse> {
    const id = userId ?? getProfileUserUuid();
    if (isLocalDemoMode()) {
      return of(this.persistLocalOnboarding(id, body));
    }
    return this.http
      .post<ProfileApiResponse>(`${this.base}/profiles/user/${id}/onboarding-complete`, body)
      .pipe(
        catchError((err) => {
          if (environment.localAuthFallback) {
            setLocalDemoMode(true);
            return of(this.persistLocalOnboarding(id, body));
          }
          return throwError(() => err);
        })
      );
  }

  getUserByEmail(email: string): Observable<UserApiResponse> {
    return this.http.get<UserApiResponse>(`${this.base}/users/email/${encodeURIComponent(email)}`);
  }

  createUserWithProfile(body: {
    userRequest: { email: string; password: string; roleName: string };
    profileRequest: { firstName: string; lastName: string };
  }): Observable<UserApiResponse> {
    return this.http.post<UserApiResponse>(`${this.base}/users`, body);
  }

  private hasLocalProfileFor(id: string): boolean {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!raw) {
      return false;
    }
    try {
      return (JSON.parse(raw) as ProfileApiResponse).userId === id;
    } catch {
      return false;
    }
  }

  private readLocalProfile(id: string): ProfileApiResponse {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (raw) {
      try {
        const p = JSON.parse(raw) as ProfileApiResponse;
        if (p.userId === id) {
          return p;
        }
      } catch {
        /* fall through */
      }
    }
    const u = localStorage.getItem('smarthire_local_user');
    let email = '';
    let firstName = 'Candidate';
    let lastName = '';
    if (u) {
      try {
        const j = JSON.parse(u) as { email?: string; firstName?: string; lastName?: string };
        email = j.email ?? '';
        firstName = j.firstName ?? firstName;
        lastName = j.lastName ?? lastName;
      } catch {
        /* ignore */
      }
    }
    return {
      userId: id,
      firstName,
      lastName,
      email,
      headline: '',
      onboardingJson: null,
    };
  }

  private writeLocalProfile(p: ProfileApiResponse): void {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(p));
  }

  private persistLocalOnboarding(id: string, body: OnboardingCompletePayload): ProfileApiResponse {
    const prev = this.readLocalProfile(id);
    const snapshot = {
      situation: body.situation,
      careerPath: body.careerPath,
      answers: body.answers ?? [],
      skillScores: body.skillScores ?? {},
      preferencesOnly: !(body.answers && body.answers.length),
      developmentPlanNotes: body.developmentPlanNotes,
      completedAt: new Date().toISOString(),
    };
    const headline =
      prev.headline?.trim() ||
      [snapshot.situation, snapshot.careerPath].filter(Boolean).join(' · ') ||
      '';
    const merged: ProfileApiResponse = {
      ...prev,
      userId: id,
      onboardingJson: JSON.stringify(snapshot),
      headline,
    };
    this.writeLocalProfile(merged);
    return merged;
  }
}
