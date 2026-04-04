import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { assessmentApiBaseUrl } from '../../../core/assessment-api-url';

export interface ChoiceViewDto {
  id: number;
  label: string;
}

export interface QuestionPaperItemDto {
  id: number;
  prompt: string;
  difficulty: string;
  points: number;
  choices: ChoiceViewDto[];
}

export interface QuestionPaperResponseDto {
  sessionId: number;
  categoryId: number;
  categoryTitle: string;
  questions: QuestionPaperItemDto[];
}

export interface SessionResponseDto {
  id: number;
  userId: string;
  categoryId: number;
  categoryTitle: string;
  topicTag: string | null;
  startedAt: string;
  completedAt: string | null;
  status: string;
  scorePercent: number | null;
  notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class CandidateSessionApiService {
  private readonly http = inject(HttpClient);

  private base(): string {
    return assessmentApiBaseUrl();
  }

  startSession(userId: string, categoryId: number): Observable<SessionResponseDto> {
    return this.http.post<SessionResponseDto>(`${this.base()}/sessions`, { userId, categoryId });
  }

  getPaper(sessionId: number): Observable<QuestionPaperResponseDto> {
    return this.http.get<QuestionPaperResponseDto>(`${this.base()}/sessions/${sessionId}/paper`);
  }

  submit(
    sessionId: number,
    selections: { questionId: number; answerChoiceId: number }[],
    notes?: string | null
  ): Observable<SessionResponseDto> {
    return this.http.post<SessionResponseDto>(`${this.base()}/sessions/${sessionId}/submit`, {
      selections,
      notes: notes ?? null,
    });
  }

  listForUser(userId: string): Observable<SessionResponseDto[]> {
    return this.http.get<SessionResponseDto[]>(`${this.base()}/sessions/user/${userId}`);
  }
}
