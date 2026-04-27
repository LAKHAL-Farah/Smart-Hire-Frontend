import { environment } from '../../environments/environment';

function resolveUrl(raw: string): string {
  const trimmed = (raw || '').trim().replace(/\/$/, '');
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${window.location.origin}${path}`;
  }

  return trimmed;
}

export function userApiBaseUrl(): string {
  return resolveUrl(environment.userApiUrl);
}

export function userAuthBaseUrl(): string {
  const explicitAuthUrl = (environment as { userAuthUrl?: string }).userAuthUrl;
  if (explicitAuthUrl && explicitAuthUrl.trim()) {
    return resolveUrl(explicitAuthUrl);
  }

  const raw = (environment.userApiUrl || '').trim().replace(/\/$/, '');
  if (!raw) {
    return '';
  }

  const root = raw.replace(/\/api\/v1$/, '');
  if (root) {
    return resolveUrl(root);
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return raw;
}