import { Routes } from '@angular/router';

/**
 * Assessment Routes (Front-Office - User Facing)
 * Lazy-loaded from dashboard
 */
export const ASSESSMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/assessment-start/assessment-start.component').then(
        (m) => m.AssessmentStartComponent
      ),
  },
  {
    path: 'quiz',
    loadComponent: () =>
      import('./pages/assessment-host/assessment-host.component').then(
        (m) => m.AssessmentHostComponent
      ),
  },
  {
    path: 'quiz/:id',
    loadComponent: () =>
      import('./pages/assessment-host/assessment-host.component').then(
        (m) => m.AssessmentHostComponent
      ),
  },
  {
    path: 'results',
    loadComponent: () =>
      import('./pages/assessment-results/assessment-results.component').then(
        (m) => m.AssessmentResultsComponent
      ),
  },
  {
    path: 'results/:id',
    loadComponent: () =>
      import('./pages/assessment-results/assessment-results.component').then(
        (m) => m.AssessmentResultsComponent
      ),
  },
  {
    path: 'report/:id',
    loadComponent: () =>
      import('./pages/assessment-results/assessment-results.component').then(
        (m) => m.AssessmentResultsComponent
      ),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./pages/assessment-history/assessment-history.component').then(
        (m) => m.AssessmentHistoryComponent
      ),
  },
];
