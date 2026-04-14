export const environment = {
  production: false,

  localAuthFallback: true,

  /** MS-User service (profiles, onboarding persistence). */
  userApiUrl: 'http://127.0.0.1:8082/api/v1',
  /** M4 profile optimization service. */
  profileOptimizationApiUrl: 'http://127.0.0.1:8086/api/v1',

  /**
   * MS-Assessment — must include `/assessment` so admin calls hit
   * `/api/v1/assessment/admin/...` (not `/api/v1/admin/...`).
   * Use a same-origin path with `ng serve` so `proxy.conf.json` forwards `/api` → :8084 and avoids CORS (status 0).
   */
  assessmentApiUrl: '/api/v1/assessment',
  /** Shared secret for header X-Admin-Api-Key — must match MS-Assessment `smarthire.assessment.admin-api-key`. */
  assessmentAdminApiKey: 'dev-assessment-admin',

  devProfileUserUuid: '00000000-0000-4000-8000-000000000001',

  /**
   * When true (dev only), `/admin` routes skip the admin-role check so you can test backoffice locally.
   */
  openAdminPanelInDev: true,
};
