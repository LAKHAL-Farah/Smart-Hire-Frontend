import { Injectable, inject, signal } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import {
  ProfileApiService,
  ProfileApiResponse,
} from '../../features/front-office/profile/profile-api.service';

/**
 * Unlocks the rest of the dashboard after at least one assessment has been saved to the profile
 * (MS-User `assessmentSkillsJson` or local demo equivalent).
 */
@Injectable({ providedIn: 'root' })
export class AssessmentGateService {
  private readonly profileApi = inject(ProfileApiService);

  /** True once the user has completed at least one assessment run. */
  readonly unlocked = signal(false);

  loadState(): Observable<boolean> {
    return this.profileApi.getProfile().pipe(
      map((p) => this.computeUnlocked(p)),
      tap((u) => this.unlocked.set(u))
    );
  }

  computeUnlocked(p: ProfileApiResponse): boolean {
    const raw = p.assessmentSkillsJson;
    if (!raw?.trim()) {
      return false;
    }
    try {
      const o = JSON.parse(raw) as Record<string, unknown>;
      if (o['lastAssessmentSummary']) {
        return true;
      }
      return Object.keys(o).some((k) => k.startsWith('codingSession_'));
    } catch {
      return false;
    }
  }

  /** For route guards: allow navigation or redirect to the assessment entry screen. */
  ensureUnlocked(): Observable<boolean | UrlTree> {
    const router = inject(Router);
    return this.loadState().pipe(
      map((ok) =>
        ok ? true : router.createUrlTree(['/dashboard', 'assessment', 'unified-start'])
      )
    );
  }

  isNavItemLocked(route: string): boolean {
    if (!route) {
      return true;
    }
    if (route.includes('/assessment')) {
      return false;
    }
    return !this.unlocked();
  }
}
