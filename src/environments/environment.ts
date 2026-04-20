export const environment = {
  production: false,

  // Authentication & Fallback Settings
  localAuthFallback: true,

  // MS-User Service (profiles, onboarding persistence)
  userApiUrl: 'http://127.0.0.1:8082/api/v1',

  // MS-Assessment Configuration
  // Must include `/assessment` so admin calls hit `/api/v1/assessment/admin/...`
  assessmentApiUrl: 'http://127.0.0.1:8084/api/v1/assessment',
  assessmentAdminApiKey: 'dev-assessment-admin',

  // MS-Roadmap Service Configuration
  roadmapApiUrl: 'http://localhost:8083/msroadmap/api',
  roadmapWsUrl: 'ws://localhost:8083/msroadmap/ws',

  // Alternative API URL structure (for backward compatibility)
  apiUrl: 'http://localhost:8083/msroadmap/api',

  // Legacy API URLs object (maintained for compatibility)
  apiUrls: {
    roadmap: 'http://localhost:8083/msroadmap/api',
    assessment: 'http://localhost:8084/api'
  },

  // Development User Configuration
  devProfileUserUuid: '00000000-0000-4000-8000-000000000001',

  // Admin Panel Access (dev only)
  // When true, /admin routes skip the admin-role check for local testing
  openAdminPanelInDev: true,
};
