import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface AdminSessionRow {
  id: number;
  userId: number;
  skill: string;
  level: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  tasksCompleted?: number;
  targetTaskCount?: number;
  multiTrack?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminAssessmentSessionsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.assessmentApiUrl.replace(/\/$/, '');

  list(page = 0, size = 50): Observable<AdminSessionRow[]> {
    return this.http.get<AdminSessionRow[]>(`${this.base}/admin/assessment-sessions`, {
      params: { page: String(page), size: String(size) },
    });
  }
}
