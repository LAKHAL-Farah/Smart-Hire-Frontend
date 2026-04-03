import { HttpErrorResponse } from '@angular/common/http';

/**
 * Spring {@code ResponseStatusException(NOT_FOUND)} for missing session/question — not a wrong URL.
 */
export function isAssessmentBusiness404(err: unknown): boolean {
  if (!(err instanceof HttpErrorResponse) || err.status !== 404) {
    return false;
  }
  const e = err.error;
  const msg =
    e && typeof e === 'object' && 'message' in e
      ? String((e as { message: string }).message)
      : typeof e === 'string'
        ? e
        : '';
  return /session not found|question not found/i.test(msg);
}

/** Missing handler / wrong context-path / SPA 404 — safe to retry another path or base URL. */
export function isAssessmentRoute404(err: unknown): boolean {
  return err instanceof HttpErrorResponse && err.status === 404 && !isAssessmentBusiness404(err);
}
