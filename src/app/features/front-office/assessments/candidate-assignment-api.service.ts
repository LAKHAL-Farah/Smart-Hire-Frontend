import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { assessmentApiBaseUrl } from '../../../core/assessment-api-url';

export type AssignmentStatusDto = 'PENDING' | 'APPROVED';

export interface AssignedCategoryDto {
  id: number;
  code: string;
  title: string;
  attemptCount: number; // How many times this category was assigned (1 = initial, 2+ = reassignments)
}

export interface CandidateAssignmentStatusDto {
  userId: string;
  status: AssignmentStatusDto;
  situation: string | null;
  careerPath: string | null;
  createdAt: string | null;
  approvedAt: string | null;
  assignedCategories: AssignedCategoryDto[];
}

@Injectable({ providedIn: 'root' })
export class CandidateAssignmentApiService {
  private readonly http = inject(HttpClient);

  private base(): string {
    return assessmentApiBaseUrl();
  }

  register(userId: string, situation: string, careerPath: string, headline?: string, customSituation?: string, customCareerPath?: string): Observable<CandidateAssignmentStatusDto> {
    return this.http.post<CandidateAssignmentStatusDto>(`${this.base()}/candidates/register`, {
      userId: userId.trim(),
      situation,
      careerPath,
      headline: headline || '',
      customSituation: customSituation || '',
      customCareerPath: customCareerPath || '',
    });
  }

  getStatus(userId: string): Observable<CandidateAssignmentStatusDto> {
    return this.http.get<CandidateAssignmentStatusDto>(`${this.base()}/candidates/${userId}/status`);
  }
}
