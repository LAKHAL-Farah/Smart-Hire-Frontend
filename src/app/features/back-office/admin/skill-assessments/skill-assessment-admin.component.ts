import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';
import {
  AssessmentAdminApiService,
  CategoryAdminRow,
  ChoiceAdminRow,
  PendingAssignmentRow,
  QuestionAdminRow,
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
  /** userId -> selected category ids for approval */
  approvalPicks: Record<string, number[]> = {};

  ngOnInit(): void {
    this.refreshCategories();
    this.refreshPending();
  }

  refreshPending(): void {
    this.api.listPendingAssignments().subscribe({
      next: (rows) => {
        this.pending = rows;
      },
      error: () => {
        this.pending = [];
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
        this.refreshPending();
        this.loading = false;
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

  selectCategory(id: number): void {
    this.selectedCategoryId = id;
    this.selectedQuestionId = null;
    this.loadQuestions();
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
    this.selectedQuestionId = this.selectedQuestionId === id ? null : id;
    this.resetChoiceForm();
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
    this.editingQuestionId = null;
    this.qForm = { prompt: '', points: 1, difficulty: 'MEDIUM', active: true, topic: '' };
  }

  editQuestion(q: QuestionAdminRow): void {
    this.editingQuestionId = q.id;
    this.qForm = {
      prompt: q.prompt,
      points: q.points,
      difficulty: q.difficulty,
      active: q.active,
      topic: q.topic ?? '',
    };
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
      next: () => this.loadQuestions(),
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
}
