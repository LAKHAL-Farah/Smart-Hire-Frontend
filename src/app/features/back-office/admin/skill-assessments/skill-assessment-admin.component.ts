import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';
import { AssessmentNotificationsService } from '../../../../core/services/assessment-notifications.service';
import { SearchService } from '../../../../core/services/search.service';
import {
  AssessmentAdminApiService,
  AssessmentSessionAdminRow,
  CategoryAdminRow,
  CategorySuggestionResult,
  ChoiceAdminRow,
  GeneratedQuestionDto,
  GenerateQuestionsResponse,
  PendingAssignmentRow,
  QuestionAdminRow,
  SessionResultAdminDto,
  UserScoresSummaryRow,
  UserProfileAdminDto,
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
  readonly searchService = inject(SearchService);

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

  pending = signal<PendingAssignmentRow[]>([]);
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
  manageAssessmentsData: { categoryId: number; categoryCode: string; categoryTitle: string; status: string; completed: boolean }[] = [];
  manageAssessmentsLoading = false;
  manageAssessmentsMessage = '';
  manageAssessmentsMessageType: 'success' | 'error' | null = null;
  manageAssessmentsSelectedToRemove: number[] = [];
  manageAssessmentsSelectedToAdd: number[] = [];

  /** Expanded user in table */
  expandedUserId: string | null = null;

  /** Question generation panel */
  generationPanelOpen = false;

  // ── User Detail Modal ──────────────────────────────────────────────────────
  userDetailOpen = false;
  userDetailLoading = false;
  userDetailProfile: UserProfileAdminDto | null = null;
  userDetailAssigned: { categoryId: number; categoryCode: string; categoryTitle: string; status: string; completed: boolean }[] = [];
  userDetailUserId = '';
  userDetailDisplayName = '';
  userDetailSuggestLoading = false;
  userDetailSuggestIds: number[] = [];
  userDetailSuggestMsg = '';
  userDetailSelectedCatIds: number[] = [];
  userDetailShowAddPanel = false;
  userDetailSaving = false;
  userDetailSaveMsg = '';
  userDetailSaveMsgType: 'success' | 'error' | null = null;

  /** Cache of userId -> display name fetched from MS-User */
  userNamesCache: Record<string, string> = {};

  /** All unique users: merge pending + users from completed sessions */
  allUsers = computed(() => {
    const map = new Map<string, { userId: string; displayName: string | null; situation: string | null; careerPath: string | null; isPending: boolean; sessionCount: number; scores: number[] }>();

    for (const s of this.completedSessions()) {
      if (!map.has(s.userId)) {
        map.set(s.userId, { userId: s.userId, displayName: s.candidateDisplayName || null, situation: null, careerPath: null, isPending: false, sessionCount: 0, scores: [] });
      }
      const u = map.get(s.userId)!;
      u.sessionCount++;
      if (s.scorePercent !== null && s.scorePercent !== undefined) u.scores.push(s.scorePercent);
    }

    for (const p of this.pending()) {
      if (!map.has(p.userId)) {
        const cachedName = this.userNamesCache[p.userId] || null;
        map.set(p.userId, { userId: p.userId, displayName: cachedName, situation: p.situation, careerPath: p.careerPath, isPending: true, sessionCount: 0, scores: [] });
      } else {
        const u = map.get(p.userId)!;
        u.isPending = true;
        u.situation = p.situation;
        u.careerPath = p.careerPath;
        if (!u.displayName && this.userNamesCache[p.userId]) {
          u.displayName = this.userNamesCache[p.userId];
        }
      }
    }

    return Array.from(map.values())
      .map(u => ({ ...u, avgScore: u.scores.length ? Math.round(u.scores.reduce((a, b) => a + b, 0) / u.scores.length) : 0 }))
      .sort((a, b) => {
        if (a.isPending && !b.isPending) return -1;
        if (!a.isPending && b.isPending) return 1;
        return b.sessionCount - a.sessionCount;
      });
  });

  /** Users filtered by topbar search query */
  filteredUsers = computed(() => {
    const q = this.searchService.query().trim().toLowerCase();
    const users = this.allUsers();
    if (!q) return users;
    return users.filter(u =>
      (u.displayName?.toLowerCase().includes(q)) ||
      (u.situation?.toLowerCase().includes(q)) ||
      (u.careerPath?.toLowerCase().includes(q)) ||
      u.userId.toLowerCase().includes(q)
    );
  });

  /** Sessions for a specific user */
  sessionsForUser(userId: string): AssessmentSessionAdminRow[] {
    return this.completedSessions()
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
  }

  /** Average score for the user currently open in the modal */
  get userDetailAvgScore(): number {
    const sessions = this.sessionsForUser(this.userDetailUserId);
    const scores = sessions
      .map(s => s.scorePercent)
      .filter((s): s is number => s !== null && s !== undefined);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }

  /** Categories not yet assigned to the user being viewed */
  get userDetailAvailableToAdd(): CategoryAdminRow[] {
    const assignedIds = new Set(this.userDetailAssigned.map(a => a.categoryId));
    return this.categories.filter(c => !assignedIds.has(c.id));
  }

  /** Assigned but not yet started */
  get userDetailPendingAssessments(): { categoryId: number; categoryCode: string; categoryTitle: string; status: string; completed: boolean }[] {
    return this.userDetailAssigned.filter(a => !a.completed);
  }

  /** Get initials: first letter of first name + first letter of last name */
  getInitials(displayName: string | null): string {
    if (!displayName || !displayName.trim()) return '?';
    const parts = displayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  openUserDetail(userId: string, displayName: string | null): void {    this.userDetailUserId = userId;
    // Use cached name or passed name
    const resolvedName = displayName || this.userNamesCache[userId] || null;
    this.userDetailDisplayName = resolvedName || userId;
    this.userDetailOpen = true;
    this.userDetailLoading = true;
    this.userDetailProfile = null;
    this.userDetailAssigned = [];
    this.userDetailShowAddPanel = false;
    this.userDetailSelectedCatIds = [];
    this.userDetailSuggestIds = [];
    this.userDetailSuggestMsg = '';
    this.userDetailSaveMsg = '';
    this.userDetailSaveMsgType = null;

    // If no name yet, fetch from MS-User
    if (!resolvedName) {
      this.api.getMsUserName(userId).subscribe({
        next: (name) => {
          if (name?.firstName || name?.lastName) {
            const fullName = [name.firstName, name.lastName].filter(Boolean).join(' ');
            this.userNamesCache[userId] = fullName;
            this.userDetailDisplayName = fullName;
          }
        }
      });
    }

    this.api.getUserProfile(userId).subscribe({
      next: p => { this.userDetailProfile = p; this.userDetailLoading = false; },
      error: () => { this.userDetailLoading = false; }
    });
    this.api.getUserAssignedAssessments(userId).subscribe({
      next: d => { this.userDetailAssigned = d; },
      error: () => {}
    });
  }

  closeUserDetail(): void {
    this.userDetailOpen = false;
    this.userDetailProfile = null;
    this.userDetailAssigned = [];
    this.userDetailUserId = '';
  }

  userDetailToggleCat(id: number): void {
    const idx = this.userDetailSelectedCatIds.indexOf(id);
    if (idx >= 0) this.userDetailSelectedCatIds.splice(idx, 1);
    else this.userDetailSelectedCatIds.push(id);
  }

  userDetailIsSuggested(id: number): boolean { return this.userDetailSuggestIds.includes(id); }
  userDetailIsSelected(id: number): boolean { return this.userDetailSelectedCatIds.includes(id); }

  userDetailSuggest(): void {
    this.userDetailSuggestLoading = true;
    this.userDetailSuggestMsg = '';
    this.api.suggestCategories(this.userDetailUserId).subscribe({
      next: result => {
        this.userDetailSuggestIds = result.suggestedCategories.map(c => c.id);
        const available = new Set(this.userDetailAvailableToAdd.map(c => c.id));
        this.userDetailSuggestIds.forEach(id => {
          if (available.has(id) && !this.userDetailIsSelected(id)) this.userDetailSelectedCatIds.push(id);
        });
        this.userDetailSuggestMsg = `AI suggested ${this.userDetailSuggestIds.length} assessment(s)`;
        this.userDetailSuggestLoading = false;
      },
      error: () => {
        this.userDetailSuggestMsg = 'AI unavailable — select manually';
        this.userDetailSuggestLoading = false;
      }
    });
  }

  userDetailSave(): void {
    if (this.userDetailSelectedCatIds.length === 0) return;
    this.userDetailSaving = true;
    this.userDetailSaveMsg = '';

    // Use assign-to-user which works for both new and existing users
    this.api.assignAssessmentToUser(
      this.userDetailUserId,
      this.userDetailSelectedCatIds,
      undefined,
      undefined,
      false
    ).subscribe({
      next: () => {
        this.userDetailSaving = false;
        this.userDetailSaveMsg = `${this.userDetailSelectedCatIds.length} assessment(s) assigned!`;
        this.userDetailSaveMsgType = 'success';
        this.userDetailSelectedCatIds = [];
        this.userDetailSuggestIds = [];
        this.api.getUserAssignedAssessments(this.userDetailUserId).subscribe({ next: d => { this.userDetailAssigned = d; } });
        this.refreshCompletedSessions();
        this.refreshPendingAssignments();
        setTimeout(() => { this.userDetailSaveMsg = ''; }, 2500);
      },
      error: (err: any) => {
        this.userDetailSaving = false;
        this.userDetailSaveMsg = err?.error?.message || 'Failed to assign';
        this.userDetailSaveMsgType = 'error';
      }
    });
  }
  generationLoading = false;
  generationCount = 5;
  generatedQuestions: GeneratedQuestionDto[] = [];
  generationMessage = '';
  generationMessageType: 'success' | 'error' | null = null;
  ollamaAvailable = false;
  savingGenerated = false;

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
    this.checkOllamaStatus();
  }

  checkOllamaStatus(): void {
    this.api.checkOllamaStatus().subscribe({
      next: (res) => {
        console.log('[Ollama] Status check result:', res);
        this.ollamaAvailable = res.available;
        console.log('[Ollama] Available:', this.ollamaAvailable);
      },
      error: (err) => {
        console.error('[Ollama] Status check error:', err);
        this.ollamaAvailable = false;
      },
    });
  }

  openGenerationPanel(): void {
    if (this.selectedCategoryId == null) {
      this.apiError = 'Select a category first.';
      return;
    }
    this.generationPanelOpen = true;
    this.generationCount = 5;
    this.generatedQuestions = [];
    this.generationMessage = '';
    this.generationMessageType = null;
  }

  closeGenerationPanel(): void {
    this.generationPanelOpen = false;
    this.generatedQuestions = [];
    this.generationMessage = '';
    this.generationMessageType = null;
  }

  generateQuestions(): void {
    if (this.selectedCategoryId == null) {
      return;
    }
    if (this.generationCount < 1 || this.generationCount > 20) {
      this.generationMessage = 'Generate between 1 and 20 questions.';
      this.generationMessageType = 'error';
      return;
    }

    console.log('[Generation] Starting generation for category:', this.selectedCategoryId, 'count:', this.generationCount);
    this.generationLoading = true;
    this.generationMessage = 'Generating questions...';
    this.generationMessageType = null;
    this.generatedQuestions = [];

    this.api.generateQuestionsPreview(this.selectedCategoryId, this.generationCount).subscribe({
      next: (response: GenerateQuestionsResponse) => {
        console.log('[Generation] Response received:', response);
        this.generationLoading = false;
        if (response.success) {
          this.generatedQuestions = response.questions;
          this.generationMessage = `Generated ${response.generatedCount} questions. Review and save them.`;
          this.generationMessageType = 'success';
          console.log('[Generation] Success! Generated questions:', this.generatedQuestions);
        } else {
          this.generationMessage = response.message || 'Failed to generate questions.';
          this.generationMessageType = 'error';
          console.error('[Generation] Failed:', response.message);
        }
      },
      error: (err) => {
        console.error('[Generation] Error:', err);
        this.generationLoading = false;
        this.generationMessage = 'Error generating questions. Check console for details.';
        this.generationMessageType = 'error';
      },
    });
  }

  saveGeneratedQuestions(): void {
    if (this.selectedCategoryId == null || this.generatedQuestions.length === 0) {
      return;
    }

    this.savingGenerated = true;
    this.api.saveGeneratedQuestions(this.selectedCategoryId, this.generatedQuestions).subscribe({
      next: () => {
        this.savingGenerated = false;
        this.generationMessage = `Saved ${this.generatedQuestions.length} questions successfully!`;
        this.generationMessageType = 'success';
        this.loadQuestions();
        setTimeout(() => this.closeGenerationPanel(), 2000);
      },
      error: (err) => {
        this.savingGenerated = false;
        this.generationMessage = 'Error saving questions.';
        this.generationMessageType = 'error';
      },
    });
  }

  discardGeneratedQuestions(): void {
    this.generatedQuestions = [];
    this.generationMessage = '';
    this.generationMessageType = null;
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
        this.pending.set(rows);
        // Fetch names for pending users that aren't in the cache yet
        rows.forEach(p => {
          if (!this.userNamesCache[p.userId]) {
            this.api.getMsUserName(p.userId).subscribe({
              next: (name) => {
                if (name?.firstName || name?.lastName) {
                  this.userNamesCache[p.userId] = [name.firstName, name.lastName].filter(Boolean).join(' ');
                  // Trigger recompute by updating the signal
                  this.pending.update(v => [...v]);
                }
              }
            });
          }
        });
      },
      error: () => { /* keep previous list */ },
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
        this.pending.update(rows => rows.filter((p: PendingAssignmentRow) => p.userId !== userId));
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
    return this.manageAssessmentsData.some(a => a.categoryId === categoryId);
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
    const currentIds = this.manageAssessmentsData.map(a => a.categoryId);
    
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
