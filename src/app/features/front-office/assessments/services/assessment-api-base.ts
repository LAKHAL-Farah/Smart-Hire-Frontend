import { environment } from '../../../../../environments/environment';

/**
 * MS-Assessment base URL including servlet context-path (`/api/v1`).
 * If only `http://host:port` is set, appends `/api/v1` (matches Spring `server.servlet.context-path`).
 */
export function assessmentApiBase(): string {
  let raw = (environment.assessmentApiUrl || '').trim().replace(/\/$/, '');
  if (!raw) {
    return 'http://127.0.0.1:8084/api/v1';
  }
  if (/^https?:\/\/[^/]+$/i.test(raw)) {
    return `${raw}/api/v1`;
  }
  return raw;
}

/**
 * Tries the configured base first, then the same host without {@code /api/v1} when the backend
 * runs with {@code server.servlet.context-path} disabled (fixes 404 on every call).
 * Relative URLs (e.g. {@code /api/v1}) are not duplicated.
 */
export function assessmentApiBaseCandidates(): string[] {
  const primary = assessmentApiBase();
  if (primary.startsWith('/')) {
    return [primary];
  }
  const withoutCtx = primary.replace(/\/api\/v1$/i, '');
  if (withoutCtx !== primary && /^https?:\/\//i.test(withoutCtx)) {
    return [primary, withoutCtx];
  }
  return [primary];
}
