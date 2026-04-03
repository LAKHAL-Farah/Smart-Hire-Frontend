import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isAssessmentRoute404 } from './assessment-http-errors';

/** Run lazy steps in order; on “route” 404 only, try the next step. */
export function chainAssessmentRoute404<T>(...steps: Array<() => Observable<T>>): Observable<T> {
  if (steps.length === 0) {
    return throwError(() => new Error('chainAssessmentRoute404: no steps'));
  }
  const [head, ...tail] = steps;
  return head().pipe(
    catchError((err) => {
      if (!isAssessmentRoute404(err) || tail.length === 0) {
        return throwError(() => err);
      }
      return chainAssessmentRoute404(...tail);
    })
  );
}
