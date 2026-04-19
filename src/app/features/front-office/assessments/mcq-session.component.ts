import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LUCIDE_ICONS } from '../../../shared/lucide-icons';
import {
  CandidateSessionApiService,
  QuestionPaperResponseDto,
  SessionResponseDto,
} from './candidate-session-api.service';
import { getAssessmentUserId } from '../profile/profile-user-id';

/** Time limit per session in seconds (45 minutes). */
const TIME_LIMIT_SEC = 45 * 60;

@Component({
  selector: 'app-mcq-session',
  standalone: true,
  imports: [CommonModule, RouterLink, LUCIDE_ICONS],
  templateUrl: './mcq-session.component.html',
  styleUrl: './mcq-session.component.scss',
})
export class McqSessionComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sessionApi = inject(CandidateSessionApiService);

  loading = signal(false);
  errorMsg = signal<string | null>(null);

  paper = signal<QuestionPaperResponseDto | null>(null);
  submitted = signal(false);
  scorePercent = signal<number | null>(null);
  scoreReleased = signal(false);
  advice = signal<string[]>([]);

  /** Map of questionId → selected choiceId */
  picks = signal<Record<number, number>>({});

  integrityViolation = signal(false);
  integrityModalOpen = signal(false);
  /** True while the integrity auto-close is in progress */
  integrityClosing = signal(false);

  forfeitLoading = signal(false);
  quitModalOpen = signal(false);
  quitModalMode = signal<'forfeit' | 'no-uid'>('forfeit');

  elapsedSec = signal(0);
  timeLimitSec = signal(TIME_LIMIT_SEC);

  remainingSec = computed(() => Math.max(0, this.timeLimitSec() - this.elapsedSec()));
  timeExpired = computed(() => this.elapsedSec() >= this.timeLimitSec());
  timeUpIncomplete = computed(
    () =>
      this.timeExpired() &&
      !this.submitted() &&
      this.paper() != null &&
      this.answeredCount() < (this.paper()?.questions.length ?? 0)
  );
  answeredCount = computed(() => Object.keys(this.picks()).length);

  private sessionId = 0;
  private clockTimer: ReturnType<typeof setInterval> | null = null;
  private visibilityHandler: (() => void) | null = null;

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('sessionId'));
    if (!Number.isFinite(this.sessionId) || this.sessionId <= 0) {
      this.errorMsg.set('Invalid session.');
      return;
    }
    this.loadPaper();
    this.startClock();
    this.registerVisibilityListener();
  }

  ngOnDestroy(): void {
    this.stopClock();
    this.removeVisibilityListener();
  }

  // ── Paper loading ──────────────────────────────────────────────────────────

  private loadPaper(): void {
    this.loading.set(true);
    this.sessionApi.getPaper(this.sessionId).subscribe({
      next: (doc) => {
        this.paper.set(doc);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.errorMsg.set(this.formatErr(err));
      },
    });
  }

  // ── Answer selection ───────────────────────────────────────────────────────

  selectChoice(questionId: number, choiceId: number): void {
    if (this.submitted() || this.integrityViolation()) return;
    this.picks.update((prev) => ({ ...prev, [questionId]: choiceId }));
  }

  canSubmit(doc: QuestionPaperResponseDto): boolean {
    return this.answeredCount() >= doc.questions.length && !this.submitted() && !this.integrityClosing();
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  submit(): void {
    const doc = this.paper();
    if (!doc || !this.canSubmit(doc)) return;
    this.doSubmit(doc);
  }

  private doSubmit(doc: QuestionPaperResponseDto): void {
    const selections = doc.questions.map((q) => ({
      questionId: q.id,
      answerChoiceId: this.picks()[q.id] ?? doc.questions[0].choices[0]?.id ?? 0,
    }));

    this.loading.set(true);
    this.errorMsg.set(null);
    this.stopClock();

    this.sessionApi.submit(this.sessionId, selections).subscribe({
      next: (session: SessionResponseDto) => {
        this.loading.set(false);
        this.integrityClosing.set(false);
        this.submitted.set(true);
        this.scorePercent.set(session.scorePercent ?? null);
        this.scoreReleased.set(session.scoreReleased ?? false);
        this.advice.set(session.advice ?? []);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.integrityClosing.set(false);
        this.errorMsg.set(this.formatErr(err));
      },
    });
  }

  // ── Back / forfeit ─────────────────────────────────────────────────────────

  onBackToAssessments(event: Event): void {
    event.preventDefault();
    if (this.submitted()) {
      this.router.navigate(['/dashboard/assessments']);
      return;
    }
    const uid = getAssessmentUserId();
    this.quitModalMode.set(uid ? 'forfeit' : 'no-uid');
    this.quitModalOpen.set(true);
  }

  dismissQuitModal(): void {
    this.quitModalOpen.set(false);
  }

  confirmQuitLeave(): void {
    const uid = getAssessmentUserId();
    if (!uid || this.quitModalMode() === 'no-uid') {
      this.quitModalOpen.set(false);
      this.router.navigate(['/dashboard/assessments']);
      return;
    }
    this.forfeitLoading.set(true);
    this.stopClock();
    this.sessionApi.forfeitSession(this.sessionId, uid).subscribe({
      next: (session: SessionResponseDto) => {
        this.forfeitLoading.set(false);
        this.quitModalOpen.set(false);
        // Show the result screen so the user can read feedback and advice
        this.submitted.set(true);
        this.scorePercent.set(session.scorePercent ?? 0);
        this.scoreReleased.set(true);
        this.advice.set(session.advice ?? []);
        // User can manually navigate back or wait for auto-redirect after 10 seconds
        setTimeout(() => this.router.navigate(['/dashboard/assessments']), 10000);
      },
      error: () => {
        this.forfeitLoading.set(false);
        this.quitModalOpen.set(false);
        this.router.navigate(['/dashboard/assessments']);
      },
    });
  }

  // ── Integrity violation ────────────────────────────────────────────────────

  private registerVisibilityListener(): void {
    this.visibilityHandler = () => {
      if (document.hidden && !this.submitted() && !this.integrityViolation()) {
        this.triggerIntegrityViolation();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private removeVisibilityListener(): void {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  private triggerIntegrityViolation(): void {
    this.integrityViolation.set(true);
    this.integrityModalOpen.set(true);
    this.stopClock();

    // Report to backend — backend now closes the session immediately at 0
    this.sessionApi
      .reportIntegrityViolation(this.sessionId, 'Tab hidden / window minimized')
      .subscribe({
        next: (session: SessionResponseDto) => {
          // Session is now COMPLETED with score 0 on the server
          this.integrityClosing.set(false);
          this.submitted.set(true);
          this.scorePercent.set(session.scorePercent ?? 0);
          this.scoreReleased.set(true);
          this.advice.set(session.advice ?? []);
        },
        error: () => {
          // Even on error, mark as closed locally
          this.integrityClosing.set(false);
          this.submitted.set(true);
          this.scorePercent.set(0);
          this.scoreReleased.set(true);
        },
      });
  }

  dismissIntegrityModal(): void {
    this.integrityModalOpen.set(false);
    // If already submitted (integrity closed), redirect after giving user time to read
    if (this.submitted()) {
      setTimeout(() => this.router.navigate(['/dashboard/assessments']), 10000);
    }
  }

  // ── Clock ──────────────────────────────────────────────────────────────────

  private startClock(): void {
    this.clockTimer = setInterval(() => {
      this.elapsedSec.update((v) => v + 1);
    }, 1000);
  }

  private stopClock(): void {
    if (this.clockTimer != null) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  }

  formatClock(totalSec: number): string {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ── Track-by ───────────────────────────────────────────────────────────────

  trackByQ(_index: number, q: { id: number }): number {
    return q.id;
  }

  // ── Error formatting ───────────────────────────────────────────────────────

  private formatErr(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const b = err.error;
      if (b && typeof b === 'object' && 'message' in b) return String((b as { message: unknown }).message);
      if (typeof b === 'string' && b.trim()) return b;
      if (err.status === 0) return 'Cannot reach MS-Assessment. Is the service running?';
      return `Error ${err.status}`;
    }
    return 'Something went wrong.';
  }
}
