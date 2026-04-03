import { Routes } from '@angular/router';

/**
 * Assessment Routes (Front-Office - User Facing)
 * Handles CAT assessment workflow with skill-based testing
 */
export const ASSESSMENTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'unified-start',
    pathMatch: 'full',
  },
  {
    path: 'start',
    loadComponent: () =>
      import('./pages/assessment-start/assessment-start.component').then(
        (m) => m.AssessmentStartComponent
      ),
  },
  {
    path: 'unified-start',
    loadComponent: () =>
      import('./pages/unified-assessment-start/unified-assessment-start.component').then(
        (m) => m.UnifiedAssessmentStartComponent
      ),
  },
  {
    path: 'unified/:sessionId',
    loadComponent: () =>
      import('./pages/unified-assessment-player/unified-assessment-player.component').then(
        (m) => m.UnifiedAssessmentPlayerComponent
      ),
  },
  {
    path: 'questions/:sessionId',
    loadComponent: () =>
      import('./pages/assessment-coding/assessment-coding.component').then(
        (m) => m.AssessmentCodingComponent
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
