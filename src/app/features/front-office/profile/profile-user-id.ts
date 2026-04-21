import { environment } from '../../../../environments/environment';

/** Persisted MS-User id (set at register / login). */
export const PROFILE_USER_UUID_STORAGE_KEY = 'smarthire_profile_user_uuid';
const DEMO_MODE_KEY = 'smarthire_local_demo_mode';
/** Auth session object (`AuthService`) — most reliable id after login. */
const AUTH_USER_STORAGE_KEY = 'user';

/** candidate | recruiter — used after register / login for routing (onboarding + assessments). */
export const ACCOUNT_ROLE_KEY = 'smarthire_account_role';

export function getProfileUserUuid(): string {
  const stored = localStorage.getItem(PROFILE_USER_UUID_STORAGE_KEY);
  if (stored && /^[0-9a-f-]{36}$/i.test(stored)) {
    return stored;
  }
  return environment.devProfileUserUuid;
}

/**
 * MS-User id for MS-Assessment APIs (sessions list, start, review).
 *
 * Assignment rows and onboarding use {@link PROFILE_USER_UUID_STORAGE_KEY}. Listing sessions under a
 * different id than the one used when starting the attempt yields an empty history and the hub stays on Start.
 *
 * When a profile UUID is stored, use it; otherwise fall back to the logged-in `user` id, then env dev.
 */
export function getAssessmentUserId(): string {
  const stored = localStorage.getItem(PROFILE_USER_UUID_STORAGE_KEY)?.trim() ?? '';
  if (/^[0-9a-f-]{36}$/i.test(stored)) {
    return stored;
  }
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (raw) {
      const u = JSON.parse(raw) as { id?: string };
      const id = u?.id != null ? String(u.id).trim() : '';
      if (/^[0-9a-f-]{36}$/i.test(id)) {
        return id;
      }
    }
  } catch {
    /* ignore */
  }
  return getProfileUserUuid();
}

export function setProfileUserUuid(uuid: string): void {
  localStorage.setItem(PROFILE_USER_UUID_STORAGE_KEY, uuid);
}

/** Browser-only demo when MS-User is unreachable (no server-side user). */
export function isLocalDemoMode(): boolean {
  return environment.localAuthFallback && localStorage.getItem(DEMO_MODE_KEY) === '1';
}

export function setLocalDemoMode(on: boolean): void {
  if (!environment.localAuthFallback) {
    localStorage.removeItem(DEMO_MODE_KEY);
    return;
  }
  if (on) {
    localStorage.setItem(DEMO_MODE_KEY, '1');
  } else {
    localStorage.removeItem(DEMO_MODE_KEY);
  }
}
