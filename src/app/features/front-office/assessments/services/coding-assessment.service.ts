import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { assessmentApiBase, assessmentApiBaseCandidates } from './assessment-api-base';
import { chainAssessmentRoute404 } from './assessment-route-retry';

function isLikelyTimeout(err: unknown): boolean {
  if (err instanceof TimeoutError) {
    return true;
  }
  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'TimeoutError') {
    return true;
  }
  return false;
}

export interface StartCodingSessionRequest {
  userId: number;
  skill: string;
  level: string;
  targetTaskCount?: number;
  /** When set, MS-Assessment runs multi-track (quiz/language) via the same POST /assessment/start URL. */
  tracks?: string[];
  weights?: Record<string, number>;
  codingTaskCount?: number;
  quizQuestionCount?: number;
  languageQuestionCount?: number;
  timeLimitSeconds?: number;
}

export interface CodingSession {
  id: number;
  /** Some APIs mirror the id under this name */
  sessionId?: number;
  userId: number;
  skill: string;
  level: string;
  startedAt?: string;
  endedAt?: string;
  theta: number;
  status?: string;
  targetTaskCount?: number;
  tasksCompleted?: number;
}

export interface CodingTask {
  id: number;
  sessionId: number;
  title: string;
  description: string;
  starterCode: string;
  skill: string;
  difficulty: string;
  taskType?: string;
  language?: string;
  testCasesJson?: string;
}

export interface CodingSubmission {
  id: number;
  taskId: number;
  userId: number;
  code: string;
  passed: boolean;
  score: number;
  feedbackJson: string;
  submittedAt: string;
}

export interface CodingAssessmentResult {
  overallScore: number;
  skills: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  finalTheta: number;
  tasksCompleted: number;
  targetTaskCount: number;
  status: string;
}

/** Human-readable message for failed HTTP calls (API down, CORS, 404, etc.) */
export function formatAssessmentHttpError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      const body = err.error;
      if (body && typeof body === 'object' && 'message' in body) {
        return String((body as { message: string }).message);
      }
      const apiUrl = (environment.assessmentApiUrl || '').trim() || '(not set)';
      const targets8084 =
        apiUrl.includes('8084') || apiUrl.includes('127.0.0.1') || apiUrl.includes('localhost');
      if (targets8084 || apiUrl.startsWith('/api')) {
        return `Cannot connect to MS-Assessment (${apiUrl}). Nothing is accepting the request — start the MS-Assessment Spring Boot app (default port 8084 in application.properties), ensure MySQL is running on port 3306, then retry.`;
      }
      return `Cannot connect to the assessment API (${apiUrl}). Set environment.assessmentApiUrl to http://127.0.0.1:8084/api/v1 (or /api/v1 with ng serve proxy), start MS-Assessment, and ensure MySQL is up.`;
    }
    if (err.status === 409) {
      return 'This session is already finished or has no more tasks.';
    }
    const body = err.error;
    if (body && typeof body === 'object' && 'message' in body) {
      return String((body as { message: string }).message);
    }
    if (typeof body === 'string' && body.length > 0) {
      return body;
    }
    return `${err.status} ${err.statusText || 'Error'}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Request failed';
}

@Injectable({
  providedIn: 'root',
})
export class CodingAssessmentService {
  /** Last started session — used for progress UI on the coding screen */
  readonly activeSession = signal<CodingSession | null>(null);

  private readonly base = assessmentApiBase();

  constructor(private http: HttpClient) {}

  setActiveSession(session: CodingSession | null): void {
    this.activeSession.set(session);
  }

  startSession(body: StartCodingSessionRequest): Observable<CodingSession> {
    const timeoutPost = (url: string): Observable<CodingSession> =>
      this.http.post<CodingSession>(url, body).pipe(
        timeout(45000),
        catchError((err) => {
          if (err instanceof TimeoutError) {
            return throwError(
              () =>
                new HttpErrorResponse({
                  status: 0,
                  statusText: 'Timeout',
                  url,
                  error: {
                    message:
                      'Request timed out. MS-Assessment may be blocked on the database — start MySQL (port 3306), verify credentials in application.properties, then retry.',
                  },
                })
            );
          }
          return throwError(() => err);
        })
      );

    const bases = assessmentApiBaseCandidates();
    const steps: Array<() => Observable<CodingSession>> = [];
    for (const b of bases) {
      steps.push(() => timeoutPost(`${b}/assessment/start`));
      if (body.tracks != null && body.tracks.length > 0) {
        steps.push(() => timeoutPost(`${b}/assessment/multi/start`));
        steps.push(() => timeoutPost(`${b}/assessment/v2/start`));
      }
    }
    return chainAssessmentRoute404(...steps);
  }

  /** First task may call OpenAI on the server — allow up to 2 minutes. */
  getTask(sessionId: number): Observable<CodingTask> {
    const bases = assessmentApiBaseCandidates();
    return chainAssessmentRoute404(
      ...bases.map(
        (b) => () =>
          this.http
            .get<CodingTask>(`${b}/assessment/task`, { params: { sessionId: String(sessionId) } })
            .pipe(
              timeout(120000),
              catchError((err) => {
                if (isLikelyTimeout(err)) {
                  return throwError(
                    () =>
                      new HttpErrorResponse({
                        status: 0,
                        statusText: 'Timeout',
                        url: `${b}/assessment/task`,
                        error: {
                          message:
                            'Loading the task timed out. Disable AI task generation: set smarthire.llm.task-generation-enabled=false (or unset OPENAI_API_KEY), restart MS-Assessment, and try again.',
                        },
                      })
                  );
                }
                return throwError(() => err);
              })
            )
      )
    );
  }

  /** Judge0 + optional LLM evaluation — allow up to 3 minutes. */
  submit(taskId: number, userId: number, code: string): Observable<CodingSubmission> {
    const bases = assessmentApiBaseCandidates();
    return chainAssessmentRoute404(
      ...bases.map(
        (b) => () =>
          this.http.post<CodingSubmission>(`${b}/assessment/submit`, { taskId, userId, code }).pipe(
            timeout(180000),
            catchError((err) => {
              if (isLikelyTimeout(err)) {
                return throwError(
                  () =>
                    new HttpErrorResponse({
                      status: 0,
                      statusText: 'Timeout',
                      url: `${b}/assessment/submit`,
                      error: {
                        message:
                          'Submit timed out (Judge0 or AI evaluation). Check network, Judge0 URL, or increase smarthire.judge0.read-timeout-ms.',
                      },
                    })
                );
              }
              return throwError(() => err);
            })
          )
      )
    );
  }

  getResult(sessionId: number): Observable<CodingAssessmentResult> {
    const bases = assessmentApiBaseCandidates();
    return chainAssessmentRoute404(
      ...bases.map(
        (b) => () =>
          this.http
            .get<CodingAssessmentResult>(`${b}/assessment/result`, {
              params: { sessionId: String(sessionId) },
            })
            .pipe(
              timeout(60000),
              catchError((err) => {
                if (isLikelyTimeout(err)) {
                  return throwError(
                    () =>
                      new HttpErrorResponse({
                        status: 0,
                        statusText: 'Timeout',
                        error: { message: 'Loading results timed out.' },
                      })
                  );
                }
                return throwError(() => err);
              })
            )
      )
    );
  }
}
