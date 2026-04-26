import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { assessmentApiBaseUrl } from '../../../core/assessment-api-url';

export interface CategoryAdminRow {
  id: number;
  code: string;
  title: string;
  description: string | null;
  questionCount: number;
}

/** Result of POST /admin/seed-default-bank */
export interface SeedDefaultBankResult {
  added: number;
  totalCategories: number;
}

export interface ChoiceAdminRow {
  id: number;
  label: string;
  correct: boolean;
  sortOrder: number;
}

export interface PendingAssignmentRow {
  userId: string;
  situation: string | null;
  careerPath: string | null;
  status: string;
  createdAt: string | null;
}

/** Completed MCQ session waiting for admin to publish the score to the candidate. */
export interface AssessmentSessionAdminRow {
  id: number;
  userId: string;
  categoryId: number;
  categoryTitle: string;
  categoryCode?: string;
  topicTag: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: string;
  scorePercent: number | null;
  scoreReleased: boolean;
  isPublished?: boolean;
  notes: string | null;
  adminFeedback: string | null;
  candidateDisplayName?: string | null;
  integrityViolation?: boolean;
  forfeit?: boolean;
  /** Which attempt number this is (1 = first, 2 = second, etc.). Only present in admin view. */
  attemptNumber?: number | null;
}

export interface UserScoresSummaryRow {
  userId: string;
  candidateDisplayName: string | null;
  situation: string | null;
  careerPath: string | null;
  overallAvgScore: number;
  sessions: {
    sessionId: number;
    categoryTitle: string;
    categoryCode: string;
    topicTag: string | null;
    scorePercent: number | null;
    scoreReleased: boolean;
    integrityViolation: boolean;
    completedAt: string | null;
  }[];
}

export interface CategorySuggestionResult {
  userId: string;
  situation: string | null;
  careerPath: string | null;
  suggestedCategoryCodes: string[];
  suggestedCategories: CategoryAdminRow[];
}

/** One row in GET /admin/sessions/{id}/review */
export interface AnswerReviewAdminRow {
  questionId: number;
  prompt: string;
  difficulty: string;
  questionPoints: number;
  selectedChoiceId: number;
  selectedLabel: string;
  correctChoiceId: number;
  correctLabel: string;
  correct: boolean;
  pointsEarned: number;
}

export interface SessionResultAdminDto {
  session: AssessmentSessionAdminRow;
  answers: AnswerReviewAdminRow[];
}

export interface QuestionAdminRow {
  id: number;
  categoryId: number;
  prompt: string;
  points: number;
  difficulty: string;
  active: boolean;
  /** Tag for topic-based quizzes (e.g. java). */
  topic?: string | null;
  choices: ChoiceAdminRow[];
}

export interface GeneratedQuestionDto {
  prompt: string;
  choices: string[];
  correctIndex: number;
  difficulty: string;
  points: number;
}

export interface GenerateQuestionsResponse {
  categoryId: number;
  categoryTitle: string | null;
  generatedCount: number;
  questions: GeneratedQuestionDto[];
  success: boolean;
  message: string;
}

export interface OllamaStatusResponse {
  available: boolean;
}

export interface UserProfileAdminDto {
  userId: string;
  headline: string | null;
  situation: string | null;
  careerPath: string | null;
  customSituation: string | null;
  customCareerPath: string | null;
  createdAt: string | null;
  status: string;
  assessmentHistory: {
    sessionId: number;
    categoryTitle: string;
    categoryCode: string;
    scorePercent: number | null;
    completedAt: string | null;
    scoreReleased: boolean;
    integrityViolation: boolean;
  }[];
  averageScore: number;
  weakAreas: { categoryCode: string; score: number }[];
  strongAreas: { categoryCode: string; score: number }[];
}

@Injectable({ providedIn: 'root' })
export class AssessmentAdminApiService {
  private readonly http = inject(HttpClient);

  private base(): string {
    return assessmentApiBaseUrl();
  }

  private adminHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Admin-Api-Key': environment.assessmentAdminApiKey,
    });
  }

  listCategories(): Observable<CategoryAdminRow[]> {
    return this.http.get<CategoryAdminRow[]>(`${this.base()}/admin/categories`, {
      headers: this.adminHeaders(),
    });
  }

  /** Inserts missing seeded categories (same as startup). Safe to call multiple times. */
  seedDefaultBank(): Observable<SeedDefaultBankResult> {
    return this.http.post<SeedDefaultBankResult>(`${this.base()}/admin/seed-default-bank`, {}, {
      headers: this.adminHeaders(),
    });
  }

  createCategory(body: { code: string; title: string; description?: string | null }): Observable<CategoryAdminRow> {
    return this.http.post<CategoryAdminRow>(`${this.base()}/admin/categories`, body, {
      headers: this.adminHeaders(),
    });
  }

  updateCategory(
    id: number,
    body: { code: string; title: string; description?: string | null }
  ): Observable<CategoryAdminRow> {
    return this.http.put<CategoryAdminRow>(`${this.base()}/admin/categories/${id}`, body, {
      headers: this.adminHeaders(),
    });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base()}/admin/categories/${id}`, {
      headers: this.adminHeaders(),
    });
  }

  listQuestions(categoryId: number): Observable<QuestionAdminRow[]> {
    return this.http.get<QuestionAdminRow[]>(`${this.base()}/admin/categories/${categoryId}/questions`, {
      headers: this.adminHeaders(),
    });
  }

  createQuestion(
    categoryId: number,
    body: { prompt: string; points: number; difficulty: string; active: boolean; topic?: string | null }
  ): Observable<QuestionAdminRow> {
    return this.http.post<QuestionAdminRow>(
      `${this.base()}/admin/categories/${categoryId}/questions`,
      body,
      { headers: this.adminHeaders() }
    );
  }

  updateQuestion(
    questionId: number,
    body: { prompt: string; points: number; difficulty: string; active: boolean; topic?: string | null }
  ): Observable<QuestionAdminRow> {
    return this.http.put<QuestionAdminRow>(`${this.base()}/admin/questions/${questionId}`, body, {
      headers: this.adminHeaders(),
    });
  }

  deleteQuestion(questionId: number): Observable<void> {
    return this.http.delete<void>(`${this.base()}/admin/questions/${questionId}`, {
      headers: this.adminHeaders(),
    });
  }

  createChoice(
    questionId: number,
    body: { label: string; correct: boolean; sortOrder: number }
  ): Observable<ChoiceAdminRow> {
    return this.http.post<ChoiceAdminRow>(
      `${this.base()}/admin/questions/${questionId}/choices`,
      body,
      { headers: this.adminHeaders() }
    );
  }

  updateChoice(
    choiceId: number,
    body: { label: string; correct: boolean; sortOrder: number }
  ): Observable<ChoiceAdminRow> {
    return this.http.put<ChoiceAdminRow>(`${this.base()}/admin/choices/${choiceId}`, body, {
      headers: this.adminHeaders(),
    });
  }

  deleteChoice(choiceId: number): Observable<void> {
    return this.http.delete<void>(`${this.base()}/admin/choices/${choiceId}`, {
      headers: this.adminHeaders(),
    });
  }

  listPendingAssignments(): Observable<PendingAssignmentRow[]> {
    return this.http.get<PendingAssignmentRow[]>(`${this.base()}/admin/assignments/pending`, {
      headers: this.adminHeaders(),
    });
  }

  /** All approved assignments — users who have been assigned categories (may have no sessions yet). */
  listApprovedAssignments(): Observable<{ userId: string; situation: string | null; careerPath: string | null }[]> {
    return this.http.get<any[]>(`${this.base()}/admin/assignments/approved`, {
      headers: this.adminHeaders(),
    });
  }

  approveAssignment(userId: string, categoryIds: number[]): Observable<unknown> {
    return this.http.post(`${this.base()}/admin/assignments/${userId}/approve`, { categoryIds }, {
      headers: this.adminHeaders(),
    });
  }

  listSessionsPendingRelease(): Observable<AssessmentSessionAdminRow[]> {
    return this.http.get<AssessmentSessionAdminRow[]>(`${this.base()}/admin/sessions/pending-release`, {
      headers: this.adminHeaders(),
    });
  }

  /** All completed attempts (newest first) — open review per session id. */
  listAllCompletedSessions(): Observable<AssessmentSessionAdminRow[]> {
    return this.http.get<AssessmentSessionAdminRow[]>(`${this.base()}/admin/sessions/completed`, {
      headers: this.adminHeaders(),
    });
  }

  /** Full candidate responses for a completed session (any state — pending release or already published). */
  getSessionReview(sessionId: number): Observable<SessionResultAdminDto> {
    return this.http.get<SessionResultAdminDto>(`${this.base()}/admin/sessions/${sessionId}/review`, {
      headers: this.adminHeaders(),
    });
  }

  releaseSessionResult(
    sessionId: number,
    options?: { adminNote?: string | null; feedbackToCandidate?: string | null }
  ): Observable<AssessmentSessionAdminRow> {
    const body: { adminNote?: string; feedbackToCandidate?: string } = {};
    const n = options?.adminNote?.trim();
    const f = options?.feedbackToCandidate?.trim();
    if (n) body.adminNote = n;
    if (f) body.feedbackToCandidate = f;
    return this.http.post<AssessmentSessionAdminRow>(
      `${this.base()}/admin/sessions/${sessionId}/release-result`,
      body,
      { headers: this.adminHeaders() }
    );
  }

  /** All completed scores for a user — no publish required. */
  getUserScores(userId: string): Observable<UserScoresSummaryRow> {
    return this.http.get<UserScoresSummaryRow>(
      `${this.base()}/admin/users/${userId}/scores`,
      { headers: this.adminHeaders() }
    );
  }

  /** AI-suggested categories based on candidate onboarding profile. */
  suggestCategories(userId: string): Observable<CategorySuggestionResult> {
    return this.http.get<CategorySuggestionResult>(
      `${this.base()}/admin/assignments/${userId}/suggest-categories`,
      { headers: this.adminHeaders() }
    );
  }

  /** Delete a completed assessment session. */
  deleteSession(sessionId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.base()}/admin/sessions/${sessionId}`,
      { headers: this.adminHeaders() }
    );
  }

  /** Assign assessments to a user (works for new and existing users). */
  assignAssessmentToUser(
    userId: string,
    categoryIds: number[],
    situation?: string | null,
    careerPath?: string | null,
    requireApproval?: boolean
  ): Observable<unknown> {
    const body: any = { 
      userId: userId, // Backend expects UUID string
      categoryIds: categoryIds.map(id => Number(id)), // Ensure they're numbers
    };
    if (situation) body.situation = situation;
    if (careerPath) body.careerPath = careerPath;
    if (requireApproval !== undefined) body.forceReassign = requireApproval;
    
    return this.http.post(
      `${this.base()}/admin/assignments/assign-to-user`,
      body,
      { headers: this.adminHeaders() }
    );
  }

  /** Get user's assigned assessments (finished or not). */
  getUserAssignedAssessments(userId: string): Observable<Array<{ categoryId: number; categoryCode: string; categoryTitle: string; status: string; completed: boolean }>> {
    return this.http.get<Array<{ categoryId: number; categoryCode: string; categoryTitle: string; status: string; completed: boolean }>>(
      `${this.base()}/admin/users/${userId}/assigned-assessments`,
      { headers: this.adminHeaders() }
    );
  }

  /** Generate questions for a category using Ollama (preview mode). */
  generateQuestionsPreview(categoryId: number, count: number): Observable<GenerateQuestionsResponse> {
    return this.http.post<GenerateQuestionsResponse>(
      `${this.base()}/admin/generate/preview`,
      { categoryId, count },
      { headers: this.adminHeaders() }
    ).pipe(
      timeout(120000) // 2 minutes — Ollama can be slow on first run
    );
  }

  /** Save generated questions to the database. */
  saveGeneratedQuestions(categoryId: number, questions: GeneratedQuestionDto[]): Observable<void> {
    return this.http.post<void>(
      `${this.base()}/admin/generate/save?categoryId=${categoryId}`,
      questions,
      { headers: this.adminHeaders() }
    );
  }

  /** Check if Ollama service is available. */
  checkOllamaStatus(): Observable<OllamaStatusResponse> {
    return this.http.get<OllamaStatusResponse>(
      `${this.base()}/admin/generate/status`,
      { headers: this.adminHeaders() }
    );
  }

  /** Get complete user profile with assessment history (admin view). */
  getUserProfile(userId: string): Observable<UserProfileAdminDto> {
    return this.http.get<UserProfileAdminDto>(
      `${this.base()}/admin/assignments/users/${userId}/profile`,
      { headers: this.adminHeaders() }
    );
  }

  /** Get user display name from MS-User service. */
  getMsUserName(userId: string): Observable<{ firstName: string | null; lastName: string | null } | null> {
    return this.http.get<any>(`http://localhost:8080/MS-USER/api/v1/users/${userId}`).pipe(
      map((r: any) => ({
        firstName: r?.profile?.firstName ?? null,
        lastName: r?.profile?.lastName ?? null,
      })),
      catchError(() => of(null))
    );
  }

  /** Add assessments to an existing user (merges, does not replace). */
  addAssessmentsToUser(userId: string, categoryIds: number[]): Observable<unknown> {
    return this.http.post(
      `${this.base()}/admin/assignments/${userId}/add-assessments`,
      { categoryIds },
      { headers: this.adminHeaders() }
    );
  }
}

