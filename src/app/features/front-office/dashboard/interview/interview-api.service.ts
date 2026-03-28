import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AddBookmarkRequest,
  AnswerEvaluationDto,
  InterviewQuestionDto,
  InterviewReportDto,
  InterviewSessionDto,
  InterviewStreakDto,
  QuestionBookmarkDto,
  RetryAnswerRequest,
  SessionAnswerDto,
  SessionQuestionOrderDto,
  StartSessionRequest,
  SubmitAnswerRequest,
  SubmitFollowUpRequest,
  UpsertQuestionRequest,
} from './interview.models';

@Injectable({
  providedIn: 'root',
})
export class InterviewApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = this.resolveBaseUrl();
  private readonly backendOrigin = this.resolveOrigin(this.baseUrl);

  resolveBackendAssetUrl(value: string): string {
    if (!value) {
      return '';
    }

    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    return `${this.backendOrigin}${value.startsWith('/') ? value : `/${value}`}`;
  }

  getStreak(userId: number): Observable<InterviewStreakDto> {
    return this.http.get<InterviewStreakDto>(`${this.baseUrl}/streaks/user/${userId}`);
  }

  getSessionsByUser(userId: number): Observable<InterviewSessionDto[]> {
    return this.http.get<InterviewSessionDto[]>(`${this.baseUrl}/sessions/user/${userId}`);
  }

  getActiveSession(userId: number): Observable<InterviewSessionDto | null> {
    return this.http.get<InterviewSessionDto | null>(`${this.baseUrl}/sessions/user/${userId}/active`);
  }

  startSession(payload: StartSessionRequest): Observable<InterviewSessionDto> {
    return this.http.post<InterviewSessionDto>(`${this.baseUrl}/sessions/start`, payload);
  }

  getSessionById(sessionId: number): Observable<InterviewSessionDto> {
    return this.http.get<InterviewSessionDto>(`${this.baseUrl}/sessions/${sessionId}`);
  }

  pauseSession(sessionId: number): Observable<InterviewSessionDto> {
    return this.http.put<InterviewSessionDto>(`${this.baseUrl}/sessions/${sessionId}/pause`, {});
  }

  resumeSession(sessionId: number): Observable<InterviewSessionDto> {
    return this.http.put<InterviewSessionDto>(`${this.baseUrl}/sessions/${sessionId}/resume`, {});
  }

  completeSession(sessionId: number): Observable<InterviewSessionDto> {
    return this.http.put<InterviewSessionDto>(`${this.baseUrl}/sessions/${sessionId}/complete`, {});
  }

  abandonSession(sessionId: number): Observable<InterviewSessionDto> {
    return this.http.put<InterviewSessionDto>(`${this.baseUrl}/sessions/${sessionId}/abandon`, {});
  }

  getSessionQuestionOrder(sessionId: number): Observable<SessionQuestionOrderDto[]> {
    return this.http.get<SessionQuestionOrderDto[]>(`${this.baseUrl}/sessions/${sessionId}/questions`);
  }

  getCurrentSessionQuestion(sessionId: number): Observable<InterviewQuestionDto> {
    return this.http.get<InterviewQuestionDto>(`${this.baseUrl}/sessions/${sessionId}/questions/current`);
  }

  submitAnswer(payload: SubmitAnswerRequest): Observable<SessionAnswerDto> {
    return this.http.post<SessionAnswerDto>(`${this.baseUrl}/answers/submit`, payload);
  }

  retryAnswer(payload: RetryAnswerRequest): Observable<SessionAnswerDto> {
    return this.http.post<SessionAnswerDto>(`${this.baseUrl}/answers/retry`, payload);
  }

  submitFollowUp(payload: SubmitFollowUpRequest): Observable<SessionAnswerDto> {
    return this.http.post<SessionAnswerDto>(`${this.baseUrl}/answers/follow-up`, payload);
  }

  triggerEvaluation(answerId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/evaluations/trigger/${answerId}`, {});
  }

  getEvaluationByAnswer(answerId: number): Observable<AnswerEvaluationDto> {
    return this.http.get<AnswerEvaluationDto>(`${this.baseUrl}/evaluations/answer/${answerId}`);
  }

  getEvaluationsBySession(sessionId: number): Observable<AnswerEvaluationDto[]> {
    return this.http.get<AnswerEvaluationDto[]>(`${this.baseUrl}/evaluations/session/${sessionId}`);
  }

  getAnswersBySession(sessionId: number): Observable<SessionAnswerDto[]> {
    return this.http.get<SessionAnswerDto[]>(`${this.baseUrl}/answers/session/${sessionId}`);
  }

  generateReport(sessionId: number): Observable<InterviewReportDto> {
    return this.http.post<InterviewReportDto>(`${this.baseUrl}/reports/generate/${sessionId}`, {});
  }

  getReportById(reportId: number): Observable<InterviewReportDto> {
    return this.http.get<InterviewReportDto>(`${this.baseUrl}/reports/${reportId}`);
  }

  getReportBySession(sessionId: number): Observable<InterviewReportDto> {
    return this.http.get<InterviewReportDto>(`${this.baseUrl}/reports/session/${sessionId}`);
  }

  getReportsByUser(userId: number): Observable<InterviewReportDto[]> {
    return this.http.get<InterviewReportDto[]>(`${this.baseUrl}/reports/user/${userId}`);
  }

  getReportPdfUrl(reportId: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/reports/${reportId}/pdf`, { responseType: 'text' });
  }

  getLeaderboard(limit = 10): Observable<InterviewStreakDto[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<InterviewStreakDto[]>(`${this.baseUrl}/streaks/leaderboard`, { params });
  }

  getBookmarksByUser(userId: number): Observable<QuestionBookmarkDto[]> {
    return this.http.get<QuestionBookmarkDto[]>(`${this.baseUrl}/bookmarks/user/${userId}`);
  }

  getBookmarkTags(userId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/bookmarks/user/${userId}/tags`);
  }

  addBookmark(payload: AddBookmarkRequest): Observable<QuestionBookmarkDto> {
    return this.http.post<QuestionBookmarkDto>(`${this.baseUrl}/bookmarks`, payload);
  }

  updateBookmarkNote(bookmarkId: number, note: string): Observable<QuestionBookmarkDto> {
    return this.http.put<QuestionBookmarkDto>(`${this.baseUrl}/bookmarks/${bookmarkId}/note`, { note });
  }

  removeBookmark(userId: number, questionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/bookmarks/user/${userId}/question/${questionId}`);
  }

  getQuestions(params?: {
    role?: string;
    type?: string;
    difficulty?: string;
  }): Observable<InterviewQuestionDto[]> {
    if (!params?.role && !params?.type && !params?.difficulty) {
      return this.http.get<InterviewQuestionDto[]>(`${this.baseUrl}/questions`);
    }

    let httpParams = new HttpParams();
    if (params.role) {
      httpParams = httpParams.set('role', params.role);
    }
    if (params.type) {
      httpParams = httpParams.set('type', params.type);
    }
    if (params.difficulty) {
      httpParams = httpParams.set('difficulty', params.difficulty);
    }

    return this.http.get<InterviewQuestionDto[]>(`${this.baseUrl}/questions/filter`, { params: httpParams });
  }

  getQuestionCoverage(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.baseUrl}/questions/coverage`);
  }

  createQuestion(payload: UpsertQuestionRequest): Observable<InterviewQuestionDto> {
    return this.http.post<InterviewQuestionDto>(`${this.baseUrl}/questions`, payload);
  }

  updateQuestion(questionId: number, payload: UpsertQuestionRequest): Observable<InterviewQuestionDto> {
    return this.http.put<InterviewQuestionDto>(`${this.baseUrl}/questions/${questionId}`, payload);
  }

  deleteQuestion(questionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/questions/${questionId}`);
  }

  addQuestionTag(questionId: number, tag: string): Observable<InterviewQuestionDto> {
    const params = new HttpParams().set('tag', tag);
    return this.http.post<InterviewQuestionDto>(`${this.baseUrl}/questions/${questionId}/tags`, null, { params });
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

  private resolveOrigin(urlLike: string): string {
    try {
      if (/^https?:\/\//i.test(urlLike)) {
        return new URL(urlLike).origin;
      }

      if (globalThis.location?.origin) {
        return new URL(urlLike, globalThis.location.origin).origin;
      }

      return '';
    } catch {
      return globalThis.location?.origin ?? '';
    }
  }
}
