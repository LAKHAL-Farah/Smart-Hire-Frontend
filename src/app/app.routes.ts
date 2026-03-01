import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing-page.component').then(
        (m) => m.LandingPageComponent
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./features/onboarding/onboarding.component').then(
        (m) => m.OnboardingComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard-home.component').then(
            (m) => m.DashboardHomeComponent
          ),
      },
      {
        path: 'roadmap',
        loadComponent: () =>
          import('./features/dashboard/roadmap/roadmap.component').then(
            (m) => m.RoadmapComponent
          ),
      },
      {
        path: 'assessment',
        loadComponent: () =>
          import('./features/dashboard/assessment/assessment.component').then(
            (m) => m.AssessmentComponent
          ),
      },
      {
        path: 'cv',
        loadComponent: () =>
          import('./features/dashboard/cv-optimizer/cv-optimizer.component').then(
            (m) => m.CvOptimizerComponent
          ),
      },
      {
        path: 'jobs',
        loadComponent: () =>
          import('./features/dashboard/jobs/jobs.component').then(
            (m) => m.JobsComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/dashboard/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/dashboard/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
      {
        path: 'interview',
        loadComponent: () =>
          import('./features/dashboard/interview/interview.component').then(
            (m) => m.InterviewComponent
          ),
      },
      {
        path: 'interview/session/:id',
        loadComponent: () =>
          import('./features/dashboard/interview/session/interview-session.component').then(
            (m) => m.InterviewSessionComponent
          ),
      },
      {
        path: 'interview/report/:id',
        loadComponent: () =>
          import('./features/dashboard/interview/report/interview-report.component').then(
            (m) => m.InterviewReportComponent
          ),
      },
    ],
  },
];
