import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { resolveCurrentInterviewUserId, resolveCurrentProfileUserId } from '../services/current-user-id';

function isMsProfileRequest(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return (
      parsed.port === '8092' ||
      parsed.pathname.startsWith('/api/cv') ||
      parsed.pathname.startsWith('/api/job-offers') ||
      parsed.pathname.startsWith('/api/linkedin') ||
      parsed.pathname.startsWith('/api/github') ||
      parsed.pathname.startsWith('/api/tips') ||
      parsed.pathname.startsWith('/api/v1/profile-tips')
    );
  } catch {
    return false;
  }
}

function isInterviewRequest(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return (
      parsed.port === '8081' ||
      parsed.pathname.startsWith('/interview-service/api/v1') ||
      parsed.pathname.startsWith('/api/v1/sessions') ||
      parsed.pathname.startsWith('/api/v1/reports') ||
      parsed.pathname.startsWith('/api/v1/streaks') ||
      parsed.pathname.startsWith('/api/v1/bookmarks') ||
      parsed.pathname.startsWith('/api/v1/questions') ||
      parsed.pathname.startsWith('/api/v1/answers') ||
      parsed.pathname.startsWith('/api/v1/evaluations') ||
      parsed.pathname.startsWith('/api/v1/pressure') ||
      parsed.pathname.startsWith('/api/v1/diagrams') ||
      parsed.pathname.startsWith('/api/v1/ml-answers')
    );
  } catch {
    return false;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  const currentProfileUserId = resolveCurrentProfileUserId();
  const currentInterviewUserId = resolveCurrentInterviewUserId();
  const shouldAttachProfileUser = isMsProfileRequest(req.url);
  const shouldAttachInterviewUser = isInterviewRequest(req.url);

  if (shouldAttachProfileUser && !currentProfileUserId) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('UserId');
    localStorage.removeItem('smarthire_profile_user_uuid');
    localStorage.removeItem('smarthire_interview_user_id');
    window.location.href = '/';
    return throwError(() => new Error('Missing authenticated user context. Please log in again.'));
  }

  if (shouldAttachInterviewUser && !currentInterviewUserId) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('UserId');
    localStorage.removeItem('smarthire_profile_user_uuid');
    localStorage.removeItem('smarthire_interview_user_id');
    window.location.href = '/';
    return throwError(() => new Error('Missing interview user context. Please log in again.'));
  }

  let authReq = req;
  if (token || shouldAttachProfileUser || shouldAttachInterviewUser) {
    const setHeaders: Record<string, string> = {};
    if (token) {
      setHeaders['Authorization'] = `Bearer ${token}`;
    }
    if (shouldAttachProfileUser) {
      setHeaders['X-User-Id'] = currentProfileUserId as string;
    }
    if (shouldAttachInterviewUser && currentInterviewUserId) {
      setHeaders['X-Interview-User-Id'] = String(currentInterviewUserId);
    }

    authReq = req.clone({
      setHeaders,
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('UserId');
        localStorage.removeItem('smarthire_profile_user_uuid');
        localStorage.removeItem('smarthire_interview_user_id');
        window.location.href = '/';
      }
      return throwError(() => error);
    })
  );
};
