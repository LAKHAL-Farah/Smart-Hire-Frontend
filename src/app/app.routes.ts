import { Routes } from '@angular/router';

export const routes: Routes = [
  /* ═══════ FRONT OFFICE ═══════ */
  {
    path: '',
    loadComponent: () =>
      import('./features/front-office/landing/landing-page.component').then(
        (m) => m.LandingPageComponent
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/front-office/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/front-office/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./features/front-office/onboarding/onboarding.component').then(
        (m) => m.OnboardingComponent
      ),
  },
  {
    path: 'interview/live/start',
    redirectTo: 'dashboard/interview/live/start',
    pathMatch: 'full',
  },
  {
    path: 'interview/live/:sessionId',
    redirectTo: 'dashboard/interview/live/:sessionId',
    pathMatch: 'full',
  },
  {
    path: 'interview/report/:id',
    loadComponent: () =>
      import('./features/front-office/dashboard/interview/report/interview-report.component').then(
        (m) => m.InterviewReportComponent
      ),
  },
  {
    path: 'dashboard/interview/live/start',
    loadComponent: () =>
      import('./interview/live-start/live-start.component').then(
        (m) => m.LiveStartComponent
      ),
  },
  {
    path: 'dashboard/interview/live/:sessionId',
    loadComponent: () =>
      import('./interview/live-mode/live-mode.component').then(
        (m) => m.LiveModeComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/front-office/dashboard/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/front-office/dashboard/dashboard-home.component').then(
            (m) => m.DashboardHomeComponent
          ),
      },
      {
        path: 'roadmap',
        loadComponent: () =>
          import('./features/front-office/dashboard/roadmap/roadmap.component').then(
            (m) => m.RoadmapComponent
          ),
      },
      {
        path: 'assessment',
        loadComponent: () =>
          import('./features/front-office/dashboard/assessment/assessment.component').then(
            (m) => m.AssessmentComponent
          ),
      },
      {
        path: 'cv',
        loadComponent: () =>
          import('./features/front-office/dashboard/cv-optimizer/cv-optimizer.component').then(
            (m) => m.CvOptimizerComponent
          ),
      },
      {
        path: 'jobs',
        loadComponent: () =>
          import('./features/front-office/dashboard/jobs/jobs.component').then(
            (m) => m.JobsComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/front-office/dashboard/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/front-office/dashboard/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
      {
        path: 'interview/setup',
        loadComponent: () =>
          import('./features/front-office/dashboard/interview/setup/interview-setup.component').then(
            (m) => m.InterviewSetupComponent
          ),
      },
      {
        path: 'interview/history',
        loadComponent: () =>
          import('./features/front-office/dashboard/interview/history/interview-history.component').then(
            (m) => m.InterviewHistoryComponent
          ),
      },
      {
        path: 'interview/bookmarks',
        loadComponent: () =>
          import('./features/front-office/dashboard/interview/bookmarks/interview-bookmarks.component').then(
            (m) => m.InterviewBookmarksComponent
          ),
      },
      {
        path: 'interview/discover',
        loadComponent: () =>
          import('./features/front-office/dashboard/interview/discover/interview-discover.component').then(
            (m) => m.InterviewDiscoverComponent
          ),
      },
      {
        path: 'interview',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/front-office/dashboard/interview/interview.component').then(
            (m) => m.InterviewComponent
          ),
      },
      {
        path: 'interview/session/:id',
        loadComponent: () =>
          import('./features/front-office/dashboard/interview/session/interview-session.component').then(
            (m) => m.InterviewSessionComponent
          ),
      },
      {
        path: 'interview/session/:id/code',
        loadComponent: () =>
          import('./features/front-office/dashboard/interview/code-screen/interview-code-screen.component').then(
            (m) => m.InterviewCodeScreenComponent
          ),
      },
      {
        path: 'interview/session/:id/cloud',
        loadComponent: () =>
          import('./features/front-office/dashboard/interview/cloud-screen/interview-cloud-screen.component').then(
            (m) => m.InterviewCloudScreenComponent
          ),
      },
      {
        path: 'interview/session/:id/ml',
        loadComponent: () =>
          import('./features/front-office/dashboard/interview/ml-screen/interview-ml-screen.component').then(
            (m) => m.InterviewMlScreenComponent
          ),
      },
      {
        path: 'interview/report/:id',
        loadComponent: () =>
          import('./features/front-office/dashboard/interview/report/interview-report.component').then(
            (m) => m.InterviewReportComponent
          ),
      },
    ],
  },

  /* ═══════ BACK OFFICE ═══════ */
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/back-office/admin/layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/back-office/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/back-office/admin/users/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
      {
        path: 'recruiters',
        loadComponent: () =>
          import('./features/back-office/admin/recruiters/recruiter-management.component').then(
            (m) => m.RecruiterManagementComponent
          ),
      },
      {
        path: 'jobs',
        loadComponent: () =>
          import('./features/back-office/admin/jobs/job-management.component').then(
            (m) => m.JobManagementComponent
          ),
      },
      {
        path: 'questions',
        loadComponent: () =>
          import('./features/back-office/admin/questions/question-management.component').then(
            (m) => m.QuestionManagementComponent
          ),
      },
      {
        path: 'interview',
        loadComponent: () =>
          import('./features/back-office/admin/interview/admin-interview-hub.component').then(
            (m) => m.AdminInterviewHubComponent
          ),
      },
      {
        path: 'ai-monitor',
        loadComponent: () =>
          import('./features/back-office/admin/ai-monitor/ai-monitor.component').then(
            (m) => m.AiMonitorComponent
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/back-office/admin/analytics/analytics.component').then(
            (m) => m.AnalyticsComponent
          ),
      },
      {
        path: 'careers',
        loadComponent: () =>
          import('./features/back-office/admin/career-paths/career-paths.component').then(
            (m) => m.CareerPathsComponent
          ),
      },
      {
        path: 'health',
        loadComponent: () =>
          import('./features/back-office/admin/system-health/system-health.component').then(
            (m) => m.SystemHealthComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/back-office/admin/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
    ],
  },

  /* ═══════ 404 WILDCARD ═══════ */
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
];
