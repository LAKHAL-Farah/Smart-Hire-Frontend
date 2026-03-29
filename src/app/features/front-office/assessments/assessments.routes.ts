import { Routes } from '@angular/router';

/**
 * Assessment Routes (Front-Office - User Facing)
 * Handles CAT assessment workflow with skill-based testing
 */
export const ASSESSMENTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'start',
    pathMatch: 'full'
  },
  {
    path: 'start',
    loadComponent: () =>
      import('./pages/assessment-start/assessment-start.component').then(
        (m) => m.AssessmentStartComponent
      ),
  },
  {
    path: 'questions/:sessionId',
    loadComponent: () =>
      import('./pages/assessment-host/assessment-host.component').then(
        (m) => m.AssessmentHostComponent
      ),
  },
  {
    path: 'results/:sessionId',
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
