import { Routes } from '@angular/router';

/**
 * Assessment Feature Routes
 * Routes for the assessment module
 */
export const ASSESSMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/assessment-host/assessment-host.component').then(
        (m) => m.AssessmentHostComponent
      ),
  },
];

export default ASSESSMENT_ROUTES;
