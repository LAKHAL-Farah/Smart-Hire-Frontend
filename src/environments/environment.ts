export const environment = {
  production: false,

  /**
   * When MS-User is down, registration and profile APIs fall back to browser storage
   * so you can still demo onboarding and profile (data stays on this device only).
   */
  localAuthFallback: true,
  /**
   * MS-Assessment — direct to backend (CORS enabled on MS-Assessment).
   * With `ng serve`, you may use `'/api/v1'` if proxy forwards /api → :8084.
   */
  assessmentApiUrl: 'http://127.0.0.1:8084/api/v1',

  /** MS-User service (profiles, onboarding persistence). */
  userApiUrl: 'http://127.0.0.1:8082/api/v1',

  /**
   * Fallback UUID when no user exists in MS-User yet — replace with a real user id from your DB,
   * or complete register/login so the app stores `smarthire_profile_user_uuid` in localStorage.
   */
  devProfileUserUuid: '00000000-0000-4000-8000-000000000001',
};
