import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LiveSession, LiveSessionStartRequest } from '../models/live-session.model';

@Injectable({ providedIn: 'root' })
export class LiveSessionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${this.resolveBaseUrl()}/sessions`;

  startLiveSession(req: LiveSessionStartRequest): Observable<LiveSession> {
    return this.http.post<LiveSession>(`${this.baseUrl}/start-live`, req);
  }

  abandonSession(sessionId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${sessionId}/abandon`, {});
  }

  private resolveBaseUrl(): string {
    const configured = (globalThis.localStorage?.getItem('smarthire.interviewApiBaseUrl') ?? '').trim();
    if (configured) {
      return configured.replace(/\/+$/, '');
    }

    if (globalThis.location?.protocol && globalThis.location?.hostname) {
      return `${globalThis.location.protocol}//${globalThis.location.hostname}:8081/interview-service/api/v1`;
    }

    return '/interview-service/api/v1';
  }
}
