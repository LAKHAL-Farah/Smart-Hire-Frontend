import { environment } from '../../../../environments/environment';

const STORAGE_KEY = 'smarthire_profile_user_uuid';
const DEMO_MODE_KEY = 'smarthire_local_demo_mode';

/** candidate | recruiter — used after register / login for routing (onboarding + assessments). */
export const ACCOUNT_ROLE_KEY = 'smarthire_account_role';

export function getProfileUserUuid(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && /^[0-9a-f-]{36}$/i.test(stored)) {
    return stored;
  }
  return environment.devProfileUserUuid;
}

export function setProfileUserUuid(uuid: string): void {
  localStorage.setItem(STORAGE_KEY, uuid);
}

/** Browser-only demo when MS-User is unreachable (no server-side user). */
export function isLocalDemoMode(): boolean {
  return localStorage.getItem(DEMO_MODE_KEY) === '1';
}

export function setLocalDemoMode(on: boolean): void {
  if (on) {
    localStorage.setItem(DEMO_MODE_KEY, '1');
  } else {
    localStorage.removeItem(DEMO_MODE_KEY);
  }
}
