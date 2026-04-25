import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { assessmentApiBaseUrl } from '../../../core/assessment-api-url';

export interface DomainScoreItemDto {
  code: string;
  title: string;
  scorePercent: number;
}

/** Aggregated skill snapshot from MS-Assessment (published attempts only). */
export interface SkillProfileDto {
  overallScore: number;
  domains: DomainScoreItemDto[];
  strengths: string[];
  weaknesses: string[];
  generatedAt: string;
  version: number;
}

@Injectable({ providedIn: 'root' })
export class SkillProfileApiService {
  private readonly http = inject(HttpClient);

  private base(): string {
    return assessmentApiBaseUrl();
  }

  getForUser(userId: string): Observable<SkillProfileDto> {
    const id = userId.trim();
    return this.http.get<SkillProfileDto>(`${this.base()}/skill-profiles/user/${encodeURIComponent(id)}`);
  }
}
