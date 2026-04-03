import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { assessmentApiBaseCandidates } from './assessment-api-base';
import { chainAssessmentRoute404 } from './assessment-route-retry';

export interface StartSessionV2Request {
  userId: number;
  skill: string;
  level: string;
  tracks?: string[];
  weights?: Record<string, number>;
  codingTaskCount?: number;
  quizQuestionCount?: number;
  languageQuestionCount?: number;
  timeLimitSeconds?: number;
}

export interface AssessmentSessionV2 {
  id: number;
  sessionId?: number;
  userId: number;
  skill: string;
  level?: string;
  multiTrack?: boolean;
  targetTaskCount?: number;
  quizTargetCount?: number;
  languageTargetCount?: number;
  expiresAt?: string;
  status?: string;
}

export type NextItemKind = 'CODING' | 'MCQ' | 'SHORT_TEXT' | 'LANGUAGE';

export interface NextAssessmentItem {
  kind: NextItemKind;
  sessionId: number;
  expiresAt?: string;
  serverTime?: string;
  codingTask?: {
    id: number;
    sessionId: number;
    title: string;
    description: string;
    starterCode: string;
    skill: string;
    difficulty: string;
    language?: string;
    testCasesJson?: string;
  };
  mcq?: { questionId: number; stem: string; options: string[] };
  shortText?: { questionId: number; stem: string; hint?: string };
  language?: {
    questionId: number;
    subtype: string;
    stem: string;
    options: string[] | null;
    prompt: string | null;
  };
}

export interface SubmitAnswerV2Request {
  userId: number;
  selectedOptionIndex?: number;
  textAnswer?: string;
}

export interface CombinedAssessmentResult {
  score: number;
  breakdown: { coding?: number; quiz?: number; language?: number };
  level: string;
  feedback: string;
  skills: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  finalTheta: number;
  codingTasksCompleted?: number;
  quizAnswered?: number;
  languageAnswered?: number;
  status: string;
}

/**
 * Multi-track player — tries {@code /assessment/start} and unified/multi/v2 paths, and alternate
 * API bases when {@code server.servlet.context-path} does not match (see assessmentApiBaseCandidates).
 */
@Injectable({ providedIn: 'root' })
export class UnifiedAssessmentService {
  constructor(private http: HttpClient) {}

  start(body: StartSessionV2Request): Observable<AssessmentSessionV2> {
    const bases = assessmentApiBaseCandidates();
    return chainAssessmentRoute404(
      ...bases.flatMap((base) => [
        () => this.http.post<AssessmentSessionV2>(`${base}/assessment/start`, body),
        () => this.http.post<AssessmentSessionV2>(`${base}/assessment/multi/start`, body),
        () => this.http.post<AssessmentSessionV2>(`${base}/assessment/v2/start`, body),
      ])
    );
  }

  next(sessionId: number): Observable<NextAssessmentItem> {
    const bases = assessmentApiBaseCandidates();
    return chainAssessmentRoute404(
      ...bases.flatMap((base) => [
        () =>
          this.http.get<NextAssessmentItem>(`${base}/assessment/unified/next`, {
            params: { sessionId: String(sessionId) },
          }),
        () => this.http.get<NextAssessmentItem>(`${base}/assessment/multi/${sessionId}/next`),
        () => this.http.get<NextAssessmentItem>(`${base}/assessment/v2/${sessionId}/next`),
      ])
    );
  }

  answer(sessionId: number, questionId: number, body: SubmitAnswerV2Request): Observable<unknown> {
    const bases = assessmentApiBaseCandidates();
    const params = { sessionId: String(sessionId), questionId: String(questionId) };
    return chainAssessmentRoute404(
      ...bases.flatMap((base) => [
        () => this.http.post(`${base}/assessment/unified/answer`, body, { params }),
        () =>
          this.http.post(`${base}/assessment/multi/${sessionId}/answer`, body, {
            params: { questionId: String(questionId) },
          }),
        () =>
          this.http.post(`${base}/assessment/v2/${sessionId}/answer`, body, {
            params: { questionId: String(questionId) },
          }),
      ])
    );
  }

  submitCode(sessionId: number, body: { taskId: number; userId: number; code: string }): Observable<unknown> {
    const bases = assessmentApiBaseCandidates();
    return chainAssessmentRoute404(
      ...bases.flatMap((base) => [
        () =>
          this.http.post(`${base}/assessment/unified/submit-code`, body, {
            params: { sessionId: String(sessionId) },
          }),
        () => this.http.post(`${base}/assessment/multi/${sessionId}/submit-code`, body),
        () => this.http.post(`${base}/assessment/v2/${sessionId}/submit-code`, body),
      ])
    );
  }

  result(sessionId: number): Observable<CombinedAssessmentResult> {
    const bases = assessmentApiBaseCandidates();
    return chainAssessmentRoute404(
      ...bases.flatMap((base) => [
        () =>
          this.http.get<CombinedAssessmentResult>(`${base}/assessment/unified/result`, {
            params: { sessionId: String(sessionId) },
          }),
        () => this.http.get<CombinedAssessmentResult>(`${base}/assessment/multi/${sessionId}/result`),
        () => this.http.get<CombinedAssessmentResult>(`${base}/assessment/v2/${sessionId}/result`),
      ])
    );
  }
}
