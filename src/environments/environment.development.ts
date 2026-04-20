export const environment = {
  production: false,
  apiUrls: {
    roadmap: 'http://localhost:8083/msroadmap/api',
    assessment: 'http://localhost:8084/api'
  },
  apiUrl: 'http://localhost:8083/msroadmap/api',
  wsUrl: 'ws://localhost:8083/msroadmap/ws',
  userApiUrl: 'http://localhost:8082/api/v1',
  assessmentApiUrl: 'http://localhost:8083/msroadmap/api/assessment',
  assessmentAdminApiKey: 'dev-assessment-admin',
  openAdminPanelInDev: true,
  localAuthFallback: false,
  devProfileUserUuid: '1'
};
