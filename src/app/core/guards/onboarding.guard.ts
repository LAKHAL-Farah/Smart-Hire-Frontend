import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProfileApiService } from '../../features/front-office/profile/profile-api.service';
import { isLocalDemoMode } from '../../features/front-office/profile/profile-user-id';

function hasCompletedPreferenceOnboarding(onboardingJson: string | null | undefined): boolean {
  if (!onboardingJson?.trim()) return false;
  try {
    const o = JSON.parse(onboardingJson) as { completedAt?: string };
    return !!o.completedAt;
  } catch {
    return false;
  }
}

/**
 * `/onboarding` is only for first-time preference capture.
 * If the profile already has onboarding JSON with `completedAt`, redirect to dashboard.
 */
export const onboardingCanMatch: CanMatchFn = async () => {
  const router = inject(Router);
  const profileApi = inject(ProfileApiService);

  if (isLocalDemoMode()) {
    try {
      const p = await firstValueFrom(profileApi.getProfile());
      if (hasCompletedPreferenceOnboarding(p.onboardingJson ?? null)) {
        await router.navigate(['/dashboard']);
        return false;
      }
    } catch {
      /* allow onboarding */
    }
    return true;
  }

  try {
    const p = await firstValueFrom(profileApi.getProfile());
    if (hasCompletedPreferenceOnboarding(p.onboardingJson ?? null)) {
      await router.navigate(['/dashboard']);
      return false;
    }
  } catch {
    /* MS-User down — allow onboarding */
  }
  return true;
};
