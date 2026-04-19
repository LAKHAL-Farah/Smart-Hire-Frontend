import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';
import { AssessmentNotificationsService } from '../../../../core/services/assessment-notifications.service';
import {
  AssessmentAdminApiService,
  AssessmentSessionAdminRow,
  CategoryAdminRow,
  CategorySuggestionResult,
  ChoiceAdminRow,
  PendingAssignmentRow,
  QuestionAdminRow,
  SessionResultAdminDto,
  UserScoresSummaryRow,
} from '../../service/assessment-admin-api.service';

@Component({
  selector: 'app-skill-assessment-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LUCIDE_ICONS],
  templateUrl: './skill-assessment-admin.component.html',
  styleUrl: './skill-assessment-admin.component.scss',
})
export class SkillAssessmentAdminComponent implements OnInit {
  private readonly api = inject(AssessmentAdminApiService);
  private readonly assessmentNotif = inject(AssessmentNotificationsService);

  loading = false;
  apiError: string | null = null;

  categories: CategoryAdminRow[] = [];
  selectedCategoryId: number | null = null;
  questions: QuestionAdminRow[] = [];
  selectedQuestionId: number | null = null;

  difficulties = ['EASY', 'MEDIUM', 'HARD'] as const;

  catForm = { code: '', title: '', description: '' };
  editingCategoryId: number | null = null;

  qForm = { prompt: '', points: 1, difficulty: 'MEDIUM' as string, active: true, topic: '' };
  editingQuestionId: number | null = null;

  choiceForm = { label: '', correct: false, sortOrder: 1 };
  editingChoiceId: number | null = null;

  pending: PendingAssignmentRow[] = [];
  /** Submitted assessments waiting for admin to publish score */
  pendingRelease: AssessmentSessionAdminRow[] = [];
  /** All completed attempts (history) */
  completedSessions = signal<AssessmentSessionAdminRow[]>([]);

  reviewOpen = false;
  reviewLoading = false;
  reviewDetail: SessionResultAdminDto | null = null;
  /** Publish modal: session row being published */
  publishTarget: AssessmentSessionAdminRow | null = null;
  publishFeedback = '';
  publishInternalNote = '';
  /** userId -> selected category ids for approval */
  approvalPicks: Record<string, number[]> = {};

  /** Show create/edit category form panel */
  showCategoryForm = false;

  /** User scores panel */
  userScoresOpen = false;
  userScoresLoading = false;
  userScoresData: UserScoresSummaryRow | null = null;
  userScoresUserId = '';

  /** AI category suggestion */
  suggestionLoading = false;
  suggestionData: CategorySuggestionResult | null = null;

  /** Delete confirmation modal */
  deleteConfirmOpen = false;
  deleteConfirmSessionId: number | null = null;
  deleteConfirmSessionTitle = '';
  deleteConfirmCandidateName = '';
  deleteConfirmLoading = false;

  /** Add assessment modal */
  addAssessmentModalOpen = false;
  addAssessmentUserId = '';
  addAssessmentSelectedCategories: number[] = [];
  addAssessmentLoading = false;
  addAssessmentMessage = '';
  addAssessmentMessageType: 'success' | 'error' | null = null;

  /** Manage user assessments panel */
  manageAssessmentsOpen = false;
  manageAssessmentsUserId = '';
  manageAssessmentsCandidateName = '';
  manageAssessmentsData: { id: number; code: string; title: string; status: string; completed: boolean }[] = [];
  manageAssessmentsLoading = false;
  manageAssessmentsMessage = '';
  manageAssessmentsMessageType: 'success' | 'error' | null = null;
  manageAssessmentsSelectedToRemove: number[] = [];
  manageAssessmentsSelectedToAdd: number[] = [];

  /** Expanded user in table */
  expandedUserId: string | null = null;

  /** Grouped sessions by user */
  groupedByUser = computed(() => {
    const grouped = new Map<string, AssessmentSessionAdminRow[]>();
    for (const session of this.completedSessions()) {
      if (!grouped.has(session.userId)) {
        grouped.set(session.userId, []);
      }
      grouped.get(session.userId)!.push(session);
    }
    return Array.from(grouped.entries()).map(([userId, sessions]) => {
      // Calculate average score
      const scores = sessions
        .map(s => s.scorePercent)
        .filter((score): score is number => score !== null && score !== undefined);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      // Check if any sessions are unpublished
      const hasUnpublished = sessions.some(s => !s.scoreReleased);

      // Check if any sessions have integrity issues
      const hasIntegrityIssues = sessions.some(s => s.integrityViolation);

      return {
        userId,
        candidateDisplayName: sessions[0]?.candidateDisplayName || null,
        attemptCount: sessions.length,
        avgScore,
        hasUnpublished,
        hasIntegrityIssues,
        sessions: sessions.sort((a, b) => {
          const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return bTime - aTime; // newest first
        }),
      };
    });
  });

  ngOnInit(): void {
    this.refreshCategories();
    this.refreshPendingAssignments();
    this.refreshPendingRelease();
    this.refreshCompletedSessions();
    this.assessmentNotif.refreshAdmin();
  }

  refreshPendingRelease(): void {
    this.api.listSessionsPendingRelease().subscribe({
      next: (rows) => {
        this.pendingRelease = rows;
      },
      error: () => {
        this.pendingRelease = [];
      },
    });
  }

  refreshCompletedSessions(): void {
    this.api.listAllCompletedSessions().subscribe({
      next: (rows) => {
        this.completedSessions.set(rows);
      },
      error: () => {
        this.completedSessions.set([]);
      },
    });
  }

  toggleUserExpand(userId: string): void {
    if (this.expandedUserId === userId) {
      this.expandedUserId = null;
    } else {
      this.expandedUserId = userId;
    }
  }

  openReview(sessionId: number): void {
    this.reviewOpen = true;
    this.reviewLoading = true;
    this.reviewDetail = null;
    this.api.getSessionReview(sessionId).subscribe({
      next: (detail) => {
        this.reviewDetail = detail;
        this.reviewLoading = false;
      },
      error: (e) => {
        this.reviewLoading = false;
        this.reviewOpen = false;
        this.fail(e);
      },
    });
  }

  closeReview(): void {
    this.reviewOpen = false;
    this.reviewDetail = null;
    this.reviewLoading = false;
  }

  openPublishModal(session: AssessmentSessionAdminRow): void {
    this.publishTarget = session;
    this.publishFeedback = '';
    this.publishInternalNote = '';
  }

  closePublishModal(): void {
    this.publishTarget = null;
  }

  openPublishFromReview(): void {
    const s = this.reviewDetail?.session;
    if (!s) return;
    this.closeReview();
    this.openPublishModal(s);
  }

  confirmPublish(): void {
    if (!this.publishTarget) return;
    const id = this.publishTarget.id;
    this.loading = true;
    this.apiError = null;
    this.api
      .releaseSessionResult(id, {
        adminNote: this.publishInternalNote.trim() || undefined,
        feedbackToCandidate: this.publishFeedback.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.closePublishModal();
          this.refreshPendingRelease();
          this.refreshCompletedSessions();
          this.loading = false;
          this.assessmentNotif.refreshAdmin();
        },
        error: (e) => this.fail(e),
      });
  }

  /** Candidates waiting for category assignment (pending only). */
  refreshPendingAssignments(): void {
    this.api.listPendingAssignments().subscribe({
      next: (rows) => {
        this.pending = rows;
      },
      error: () => {
        /* keep previous list — do not clear on transient errors */
      },
    });
  }

  toggleApprovalCat(userId: string, catId: number): void {
    const cur = [...(this.approvalPicks[userId] ?? [])];
    const i = cur.indexOf(catId);
    if (i >= 0) {
      cur.splice(i, 1);
    } else {
      cur.push(catId);
    }
    this.approvalPicks[userId] = cur;
  }

  isApprovalCat(userId: string, catId: number): boolean {
    return (this.approvalPicks[userId] ?? []).includes(catId);
  }

  approveRow(userId: string): void {
    const ids = this.approvalPicks[userId] ?? [];
    if (ids.length === 0) {
      this.apiError = 'Select at least one category for this candidate.';
      return;
    }
    this.loading = true;
    this.apiError = null;
    this.api.approveAssignment(userId, ids).subscribe({
      next: () => {
        delete this.approvalPicks[userId];
        this.pending = this.pending.filter((p) => p.userId !== userId);
        this.refreshPendingAssignments();
        this.loading = false;
        this.assessmentNotif.refreshAdmin();
      },
      error: (e) => this.fail(e),
    });
  }

  refreshCategories(): void {
    this.loading = true;
    this.apiError = null;
    this.api.listCategories().subscribe({
      next: (rows) => {
        this.categories = rows;
        this.loading = false;
        if (this.selectedCategoryId != null && !rows.some((c) => c.id === this.selectedCategoryId)) {
          this.selectedCategoryId = null;
          this.questions = [];
        }
      },
      error: (e) => this.fail(e),
    });
  }

  /** Loads default seeded categories into the DB if they are missing (repairs old DBs with only JAVA_OOP). */
  seedDefaultBank(): void {
    this.loading = true;
    this.apiError = null;
    this.api.seedDefaultBank().subscribe({
      next: () => {
        this.refreshCategories();
      },
      error: (e) => this.fail(e),
    });
  }

  selectCategory(id: number): void {
    this.selectedCategoryId = id;
    this.selectedQuestionId = null;
    this.showCategoryForm = false;
    this.resetChoiceForm();
    this.loadQuestions();
  }

  /** Category row selected in the table (for template clarity). */
  get selectedCategory(): CategoryAdminRow | null {
    if (this.selectedCategoryId == null) {
      return null;
    }
    return this.categories.find((c) => c.id === this.selectedCategoryId) ?? null;
  }

  openNewCategoryForm(): void {
    this.startNewCategory();
    this.showCategoryForm = true;
  }

  cancelCategoryForm(): void {
    this.showCategoryForm = false;
    this.editingCategoryId = null;
    this.catForm = { code: '', title: '', description: '' };
  }

  toggleQuestionExpand(questionId: number): void {
    if (this.selectedQuestionId === questionId) {
      this.selectedQuestionId = null;
      this.resetChoiceForm();
    } else {
      this.selectedQuestionId = questionId;
      this.resetChoiceForm();
    }
  }

  loadQuestions(): void {
    if (this.selectedCategoryId == null) {
      this.questions = [];
      return;
    }
    this.loading = true;
    this.apiError = null;
    this.api.listQuestions(this.selectedCategoryId).subscribe({
      next: (rows) => {
        this.questions = rows;
        this.loading = false;
      },
      error: (e) => this.fail(e),
    });
  }

  selectQuestion(id: number): void {
    this.toggleQuestionExpand(id);
  }

  startNewCategory(): void {
    this.editingCategoryId = null;
    this.catForm = { code: '', title: '', description: '' };
  }

  editCategory(c: CategoryAdminRow): void {
    this.editingCategoryId = c.id;
    this.catForm = {
      code: c.code,
      title: c.title,
      description: c.description ?? '',
    };
    this.showCategoryForm = true;
  }

  saveCategory(): void {
    const body = {
      code: this.catForm.code.trim(),
      title: this.catForm.title.trim(),
      description: this.catForm.description.trim() || null,
    };
    if (!body.code || !body.title) {
      this.apiError = 'Code and title are required.';
      return;
    }
    this.loading = true;
    this.apiError = null;
    const req =
      this.editingCategoryId == null
        ? this.api.createCategory(body)
        : this.api.updateCategory(this.editingCategoryId, body);
    req.subscribe({
      next: () => {
        this.editingCategoryId = null;
        this.catForm = { code: '', title: '', description: '' };
        this.showCategoryForm = false;
        this.refreshCategories();
      },
      error: (e) => this.fail(e),
    });
  }

  deleteCategory(c: CategoryAdminRow): void {
    if (!confirm(`Delete category "${c.title}" and all its questions?`)) {
      return;
    }
    this.loading = true;
    this.api.deleteCategory(c.id).subscribe({
      next: () => {
        if (this.selectedCategoryId === c.id) {
          this.selectedCategoryId = null;
          this.questions = [];
        }
        this.refreshCategories();
      },
      error: (e) => this.fail(e),
    });
  }

  startNewQuestion(): void {
    if (this.selectedCategoryId == null) {
      return;
    }
    this.selectedQuestionId = null;
    this.editingQuestionId = null;
    this.qForm = { prompt: '', points: 1, difficulty: 'MEDIUM', active: true, topic: '' };
    this.resetChoiceForm();
  }

  editQuestion(q: QuestionAdminRow): void {
    this.selectedQuestionId = q.id;
    this.editingQuestionId = q.id;
    this.qForm = {
      prompt: q.prompt,
      points: q.points,
      difficulty: q.difficulty,
      active: q.active,
      topic: q.topic ?? '',
    };
    this.resetChoiceForm();
  }

  saveQuestion(): void {
    if (this.selectedCategoryId == null) {
      return;
    }
    const topicTrim = this.qForm.topic.trim();
    const body = {
      prompt: this.qForm.prompt.trim(),
      points: this.qForm.points,
      difficulty: this.qForm.difficulty,
      active: this.qForm.active,
      topic: topicTrim.length > 0 ? topicTrim : null,
    };
    if (!body.prompt) {
      this.apiError = 'Prompt is required.';
      return;
    }
    this.loading = true;
    this.apiError = null;
    const req =
      this.editingQuestionId == null
        ? this.api.createQuestion(this.selectedCategoryId, body)
        : this.api.updateQuestion(this.editingQuestionId, body);
    req.subscribe({
      next: () => {
        this.editingQuestionId = null;
        this.qForm = { prompt: '', points: 1, difficulty: 'MEDIUM', active: true, topic: '' };
        this.loadQuestions();
      },
      error: (e) => this.fail(e),
    });
  }

  deleteQuestion(q: QuestionAdminRow): void {
    if (!confirm('Delete this question?')) {
      return;
    }
    this.loading = true;
    this.api.deleteQuestion(q.id).subscribe({
      next: () => {
        if (this.selectedQuestionId === q.id) {
          this.selectedQuestionId = null;
          this.resetChoiceForm();
        }
        this.loadQuestions();
      },
      error: (e) => this.fail(e),
    });
  }

  resetChoiceForm(): void {
    this.editingChoiceId = null;
    this.choiceForm = { label: '', correct: false, sortOrder: 1 };
  }

  startNewChoice(): void {
    this.resetChoiceForm();
  }

  editChoice(ch: ChoiceAdminRow): void {
    this.editingChoiceId = ch.id;
    this.choiceForm = {
      label: ch.label,
      correct: ch.correct,
      sortOrder: ch.sortOrder,
    };
  }

  saveChoice(): void {
    const q = this.selectedQuestion;
    if (!q) {
      return;
    }
    const body = {
      label: this.choiceForm.label.trim(),
      correct: this.choiceForm.correct,
      sortOrder: this.choiceForm.sortOrder,
    };
    if (!body.label) {
      this.apiError = 'Choice label is required.';
      return;
    }
    this.loading = true;
    this.apiError = null;
    const req =
      this.editingChoiceId == null
        ? this.api.createChoice(q.id, body)
        : this.api.updateChoice(this.editingChoiceId, body);
    req.subscribe({
      next: () => {
        this.resetChoiceForm();
        this.loadQuestions();
      },
      error: (e) => this.fail(e),
    });
  }

  deleteChoice(ch: ChoiceAdminRow): void {
    if (!confirm('Delete this choice?')) {
      return;
    }
    this.loading = true;
    this.api.deleteChoice(ch.id).subscribe({
      next: () => this.loadQuestions(),
      error: (e) => this.fail(e),
    });
  }

  get selectedQuestion(): QuestionAdminRow | null {
    if (this.selectedQuestionId == null) {
      return null;
    }
    return this.questions.find((q) => q.id === this.selectedQuestionId) ?? null;
  }

  /** Sum of question counts from API (all categories). */
  get totalQuestionsInBank(): number {
    return this.categories.reduce((sum, c) => sum + c.questionCount, 0);
  }

  /** Choices on the currently selected question. */
  get choicesCountSelected(): number {
    return this.selectedQuestion?.choices.length ?? 0;
  }

  private fail(err: unknown): void {
    this.loading = false;
    let msg = 'Request failed. Is MS-Assessment running on port 8084?';

    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        msg =
          'Network error — MS-Assessment not reachable or CORS blocked. Use http://127.0.0.1:8084 and check the service is up.';
      } else if (err.status === 401) {
        msg =
          'Unauthorized (401) — set environment.assessmentAdminApiKey to match the server (default: dev-assessment-admin).';
      } else if (err.error && typeof err.error === 'object' && err.error !== null && 'message' in err.error) {
        msg = String((err.error as { message: unknown }).message);
      } else if (typeof err.error === 'string' && err.error.length > 0 && err.error.length < 800) {
        msg = err.error;
      } else {
        msg = `HTTP ${err.status}${err.statusText ? ': ' + err.statusText : ''}`;
      }
    } else if (err && typeof err === 'object' && 'error' in err) {
      const body = (err as { error?: unknown }).error;
      if (typeof body === 'object' && body && 'message' in body) {
        msg = String((body as { message: unknown }).message);
      } else if (typeof body === 'string') {
        msg = body;
      }
    }
    this.apiError = msg;
  }

  // ── User scores ────────────────────────────────────────────────────────────

  openUserScores(userId: string): void {
    this.userScoresUserId = userId;
    this.userScoresOpen = true;
    this.userScoresData = null;
    this.userScoresLoading = true;
    this.api.getUserScores(userId).subscribe({
      next: (data) => {
        this.userScoresData = data;
        this.userScoresLoading = false;
      },
      error: (e) => {
        this.userScoresLoading = false;
        this.fail(e);
      },
    });
  }

  closeUserScores(): void {
    this.userScoresOpen = false;
    this.userScoresData = null;
  }

  // ── AI category suggestion ─────────────────────────────────────────────────

  loadSuggestion(userId: string): void {
    this.suggestionLoading = true;
    this.suggestionData = null;
    this.api.suggestCategories(userId).subscribe({
      next: (data) => {
        this.suggestionData = data;
        this.suggestionLoading = false;
        // Pre-select suggested categories for this user
        if (data.suggestedCategories?.length) {
          this.approvalPicks[userId] = data.suggestedCategories.map((c) => c.id);
        }
      },
      error: (e) => {
        this.suggestionLoading = false;
        this.fail(e);
      },
    });
  }

  // ── Delete session ─────────────────────────────────────────────────────

  openDeleteConfirm(session: AssessmentSessionAdminRow): void {
    this.deleteConfirmSessionId = session.id;
    this.deleteConfirmSessionTitle = session.categoryTitle;
    this.deleteConfirmCandidateName = session.candidateDisplayName || 'Unknown';
    this.deleteConfirmOpen = true;
  }

  closeDeleteConfirm(): void {
    this.deleteConfirmOpen = false;
    this.deleteConfirmSessionId = null;
    this.deleteConfirmSessionTitle = '';
    this.deleteConfirmCandidateName = '';
    this.deleteConfirmLoading = false;
  }

  confirmDelete(): void {
    if (!this.deleteConfirmSessionId) return;
    this.deleteConfirmLoading = true;
    const sessionId = this.deleteConfirmSessionId;
    this.api.deleteSession(sessionId).subscribe({
      next: () => {
        this.deleteConfirmLoading = false;
        this.closeDeleteConfirm();
        // Remove from completedSessions without reloading - update signal
        const updated = this.completedSessions().filter((s: AssessmentSessionAdminRow) => s.id !== sessionId);
        this.completedSessions.set(updated);
        this.refreshPendingRelease();
      },
      error: (e) => {
        this.deleteConfirmLoading = false;
        this.fail(e);
      },
    });
  }

  // ── Add assessment modal ────────────────────────────────────────────────────

  openAddAssessmentModal(userId: string): void {
    this.addAssessmentModalOpen = true;
    this.addAssessmentUserId = userId;
    this.addAssessmentSelectedCategories = [];
    this.addAssessmentMessage = '';
    this.addAssessmentMessageType = null;
  }

  closeAddAssessmentModal(): void {
    this.addAssessmentModalOpen = false;
    this.addAssessmentUserId = '';
    this.addAssessmentSelectedCategories = [];
    this.addAssessmentMessage = '';
    this.addAssessmentMessageType = null;
  }

  toggleAddAssessmentCategory(categoryId: number): void {
    const idx = this.addAssessmentSelectedCategories.indexOf(categoryId);
    if (idx >= 0) {
      this.addAssessmentSelectedCategories.splice(idx, 1);
    } else {
      this.addAssessmentSelectedCategories.push(categoryId);
    }
  }

  isAddAssessmentCategorySelected(categoryId: number): boolean {
    return this.addAssessmentSelectedCategories.includes(categoryId);
  }

  confirmAddAssessment(): void {
    if (this.addAssessmentSelectedCategories.length === 0) {
      this.addAssessmentMessage = 'Please select at least one category';
      this.addAssessmentMessageType = 'error';
      return;
    }

    this.addAssessmentLoading = true;
    this.addAssessmentMessage = '';
    this.addAssessmentMessageType = null;

    this.api.assignAssessmentToUser(
      this.addAssessmentUserId,
      this.addAssessmentSelectedCategories,
      undefined,
      undefined,
      false
    ).subscribe({
      next: () => {
        this.addAssessmentLoading = false;
        this.addAssessmentMessage = `Successfully added ${this.addAssessmentSelectedCategories.length} assessment(s)`;
        this.addAssessmentMessageType = 'success';

        // Refresh data after 1.5 seconds
        setTimeout(() => {
          this.refreshCompletedSessions();
          this.closeAddAssessmentModal();
        }, 1500);
      },
      error: (e: unknown) => {
        this.addAssessmentLoading = false;
        this.addAssessmentMessageType = 'error';
        let msg = 'Failed to add assessments';
        if (e instanceof HttpErrorResponse && e.error?.message) {
          msg = e.error.message;
        }
        this.addAssessmentMessage = msg;
      },
    });
  }

  // ── Manage user assessments panel ────────────────────────────────────────

  openManageAssessments(userId: string, candidateName: string | null): void {
    this.manageAssessmentsUserId = userId;
    this.manageAssessmentsCandidateName = candidateName || userId;
    this.manageAssessmentsOpen = true;
    this.manageAssessmentsLoading = true;
    this.manageAssessmentsData = [];
    this.manageAssessmentsSelectedToRemove = [];
    this.manageAssessmentsSelectedToAdd = [];
    this.manageAssessmentsMessage = '';
    this.manageAssessmentsMessageType = null;

    // Load user's assigned assessments
    this.api.getUserAssignedAssessments(userId).subscribe({
      next: (data) => {
        this.manageAssessmentsData = data;
        this.manageAssessmentsLoading = false;
      },
      error: (e) => {
        this.manageAssessmentsLoading = false;
        this.fail(e);
      },
    });
  }

  closeManageAssessments(): void {
    this.manageAssessmentsOpen = false;
    this.manageAssessmentsUserId = '';
    this.manageAssessmentsCandidateName = '';
    this.manageAssessmentsData = [];
    this.manageAssessmentsSelectedToRemove = [];
    this.manageAssessmentsSelectedToAdd = [];
    this.manageAssessmentsMessage = '';
    this.manageAssessmentsMessageType = null;
  }

  toggleManageRemoveAssessment(categoryId: number): void {
    const idx = this.manageAssessmentsSelectedToRemove.indexOf(categoryId);
    if (idx >= 0) {
      this.manageAssessmentsSelectedToRemove.splice(idx, 1);
    } else {
      this.manageAssessmentsSelectedToRemove.push(categoryId);
    }
  }

  isManageRemoveSelected(categoryId: number): boolean {
    return this.manageAssessmentsSelectedToRemove.includes(categoryId);
  }

  toggleManageAddAssessment(categoryId: number): void {
    const idx = this.manageAssessmentsSelectedToAdd.indexOf(categoryId);
    if (idx >= 0) {
      this.manageAssessmentsSelectedToAdd.splice(idx, 1);
    } else {
      this.manageAssessmentsSelectedToAdd.push(categoryId);
    }
  }

  isManageAddSelected(categoryId: number): boolean {
    return this.manageAssessmentsSelectedToAdd.includes(categoryId);
  }

  isAssessmentAlreadyAssigned(categoryId: number): boolean {
    return this.manageAssessmentsData.some(a => a.id === categoryId);
  }

  confirmManageAssessments(): void {
    const hasRemove = this.manageAssessmentsSelectedToRemove.length > 0;
    const hasAdd = this.manageAssessmentsSelectedToAdd.length > 0;

    if (!hasRemove && !hasAdd) {
      this.manageAssessmentsMessage = 'Select assessments to add or remove';
      this.manageAssessmentsMessageType = 'error';
      return;
    }

    this.manageAssessmentsLoading = true;
    this.manageAssessmentsMessage = '';
    this.manageAssessmentsMessageType = null;

    // Get current assigned categories
    const currentIds = this.manageAssessmentsData.map(a => a.id);
    
    // Remove selected ones
    let finalIds = currentIds.filter(id => !this.manageAssessmentsSelectedToRemove.includes(id));
    
    // Add new ones
    finalIds = [...new Set([...finalIds, ...this.manageAssessmentsSelectedToAdd])];

    // Call API to update
    this.api.assignAssessmentToUser(
      this.manageAssessmentsUserId,
      finalIds,
      undefined,
      undefined,
      false
    ).subscribe({
      next: () => {
        this.manageAssessmentsLoading = false;
        const removedCount = this.manageAssessmentsSelectedToRemove.length;
        const addedCount = this.manageAssessmentsSelectedToAdd.length;
        let msg = '';
        if (removedCount > 0 && addedCount > 0) {
          msg = `Removed ${removedCount}, added ${addedCount} assessment(s)`;
        } else if (removedCount > 0) {
          msg = `Removed ${removedCount} assessment(s)`;
        } else {
          msg = `Added ${addedCount} assessment(s)`;
        }
        this.manageAssessmentsMessage = msg;
        this.manageAssessmentsMessageType = 'success';

        // Refresh after 1.5 seconds
        setTimeout(() => {
          this.refreshCompletedSessions();
          this.openManageAssessments(this.manageAssessmentsUserId, this.manageAssessmentsCandidateName);
        }, 1500);
      },
      error: (e: unknown) => {
        this.manageAssessmentsLoading = false;
        this.manageAssessmentsMessageType = 'error';
        let msg = 'Failed to update assessments';
        if (e instanceof HttpErrorResponse && e.error?.message) {
          msg = e.error.message;
        }
        this.manageAssessmentsMessage = msg;
      },
    });
  }
}
