import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AssessmentGateService } from '../services/assessment-gate.service';

/**
 * Blocks dashboard areas until the candidate has completed at least one assessment.
 * Everything under `/dashboard/assessment/**` stays reachable so they can finish or retake.
 */
export const firstAssessmentGuard: CanMatchFn = () => {
  const router = inject(Router);
  const path = router.url.split('?')[0];
  if (path === '/dashboard/assessment' || path.startsWith('/dashboard/assessment/')) {
    return true;
  }
  return inject(AssessmentGateService).ensureUnlocked();
};
