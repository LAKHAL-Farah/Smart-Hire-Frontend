import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS } from '../../../shared/lucide-icons';
import {
  CandidateSessionApiService,
  QuestionPaperItemDto,
  QuestionPaperResponseDto,
} from './candidate-session-api.service';
import { getAssessmentUserId } from '../profile/profile-user-id';
import { AssessmentNotificationsService } from '../../../core/services/assessment-notifications.service';

@Component({
  selector: 'app-mcq-session',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LUCIDE_ICONS],
  templateUrl: './mcq-session.component.html',
  styleUrl: './mcq-session.component.scss',
})
export class McqSessionComponent implements OnInit, OnDestroy {
  private readonly api = inject(CandidateSessionApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly assessmentNotif = inject(AssessmentNotificationsService);

  loading = signal(true);
  errorMsg = signal<string | null>(null);

  paper = signal<QuestionPaperResponseDto | null>(null);
  /** questionId -> choiceId */
  picks = signal<Record<number, number>>({});

  submitted = signal(false);
  scorePercent = signal<number | null>(null);
  sessionId = signal<number | null>(null);

  /** Set when the user leaves the tab/window — backend forces score 0 on submit. */
  integrityViolation = signal(false);
  /** Full-screen integrity dialog (replaces browser alert). */
  integrityModalOpen = signal(false);

  private visibilityHandler?: () => void;
  /** Browser timer id (number). */
  private armTimeoutId: number | null = null;
  /** 1s tick for quiz elapsed / countdown (browser timer id). */
  private quizTickId: number | null = null;
  private integrityReported = false;
  /** Prevent double auto-submit when time runs out */
  private timeUpAutoSubmitDone = false;

  /** True while POST /forfeit is in flight */
  forfeitLoading = signal(false);

  /** Questions with a selected answer (progress bar) */
  answeredCount = computed(() => {
    const p = this.paper();
    if (!p) return 0;
    const m = this.picks();
    return p.questions.filter((q) => m[q.id] != null).length;
  });

  /** Seconds since question paper loaded (active quiz only). */
  elapsedSec = signal(0);
  /** Allowed time for this attempt in seconds (from question count). */
  timeLimitSec = signal(0);

  /** Remaining time = limit − elapsed (negative after expiry). */
  remainingSec = computed(() => this.timeLimitSec() - this.elapsedSec());

  /** True once the countdown reaches zero. */
  timeExpired = signal(false);

  /** In-app quit dialog (replaces browser confirm) */
  quitModalOpen = signal(false);
  /** `forfeit` = close attempt at 0%; `no-user` = leave without API */
  quitModalMode = signal<'forfeit' | 'no-user'>('forfeit');

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('sessionId');
    const sid = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(sid)) {
      this.loading.set(false);
      this.errorMsg.set('Invalid session.');
      return;
    }
    this.sessionId.set(sid);
    this.api.getPaper(sid).subscribe({
      next: (p) => {
        this.paper.set(p);
        this.timeLimitSec.set(this.computeTimeLimitSeconds(p.questions.length));
        this.elapsedSec.set(0);
        this.timeExpired.set(false);
        this.timeUpAutoSubmitDone = false;
        this.startQuizTimer();
        this.loading.set(false);
        this.armIntegrityMonitor(sid);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.errorMsg.set(this.formatErr(err));
      },
    });
  }

  ngOnDestroy(): void {
    this.stopQuizTimer();
    if (this.armTimeoutId !== null) {
      window.clearTimeout(this.armTimeoutId);
      this.armTimeoutId = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  /**
   * Short windows: 3–20 min, ~30 s per question (capped) so attempts stay brief.
   */
  private computeTimeLimitSeconds(questionCount: number): number {
    const n = Math.max(1, questionCount);
    return Math.min(1200, Math.max(180, n * 30));
  }

  private startQuizTimer(): void {
    this.stopQuizTimer();
    this.quizTickId = window.setInterval(() => {
      if (this.submitted()) {
        this.stopQuizTimer();
        return;
      }
      this.elapsedSec.update((s) => s + 1);
      const doc = this.paper();
      if (!doc) return;

      const rem = this.timeLimitSec() - this.elapsedSec();
      if (rem <= 0) {
        if (!this.timeExpired()) {
          this.timeExpired.set(true);
        }
        if (
          !this.timeUpAutoSubmitDone &&
          !this.loading() &&
          this.canSubmit(doc)
        ) {
          this.timeUpAutoSubmitDone = true;
          this.submit();
        }
      }
    }, 1000);
  }

  private stopQuizTimer(): void {
    if (this.quizTickId !== null) {
      window.clearInterval(this.quizTickId);
      this.quizTickId = null;
    }
  }

  /** Formats signed seconds as H:MM:SS or M:SS */
  formatClock(seconds: number): string {
    const sign = seconds < 0 ? '−' : '';
    const s = Math.floor(Math.abs(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${sign}${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    return `${sign}${m}:${String(sec).padStart(2, "0")}`;
  }

  /**
   * Ignore the first ~800ms (initial load / browser quirks), then treat tab/window hide as a violation once.
   */
  private armIntegrityMonitor(sid: number): void {
    this.armTimeoutId = window.setTimeout(() => {
      this.armTimeoutId = null;
      this.visibilityHandler = () => {
        if (document.visibilityState !== 'hidden' || this.integrityReported) {
          return;
        }
        this.integrityReported = true;
        document.removeEventListener('visibilitychange', this.visibilityHandler!);
        this.api.reportIntegrityViolation(sid, 'visibility_hidden').subscribe({
          next: () => {
            this.integrityViolation.set(true);
            this.integrityModalOpen.set(true);
          },
          error: () => {
            this.integrityReported = false;
            document.addEventListener('visibilitychange', this.visibilityHandler!);
          },
        });
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }, 800);
  }

  dismissIntegrityModal(): void {
    this.integrityModalOpen.set(false);
  }

  dismissQuitModal(): void {
    this.quitModalOpen.set(false);
  }

  /**
   * Back to assessments — opens enhanced confirm (forfeit at 0% when logged in).
   */
  onBackToAssessments(event: Event): void {
    event.preventDefault();
    if (this.submitted() || this.forfeitLoading() || this.quitModalOpen()) {
      return;
    }
    const sid = this.sessionId();
    if (sid == null) {
      void this.router.navigateByUrl('/dashboard/assessments');
      return;
    }
    const uid = getAssessmentUserId();
    this.quitModalMode.set(uid ? 'forfeit' : 'no-user');
    this.quitModalOpen.set(true);
  }

  confirmQuitLeave(): void {
    const mode = this.quitModalMode();
    this.quitModalOpen.set(false);
    if (mode === 'no-user') {
      void this.router.navigateByUrl('/dashboard/assessments');
      return;
    }
    const sid = this.sessionId();
    const uid = getAssessmentUserId();
    if (!sid || !uid) {
      void this.router.navigateByUrl('/dashboard/assessments');
      return;
    }
    this.forfeitLoading.set(true);
    this.api.forfeitSession(sid, uid).subscribe({
      next: () => {
        this.forfeitLoading.set(false);
        void this.router.navigateByUrl('/dashboard/assessments');
      },
      error: () => {
        this.forfeitLoading.set(false);
        void this.router.navigateByUrl('/dashboard/assessments');
      },
    });
  }

  selectChoice(questionId: number, choiceId: number): void {
    this.picks.update((m) => ({ ...m, [questionId]: choiceId }));
  }

  canSubmit(paper: QuestionPaperResponseDto): boolean {
    const m = this.picks();
    return paper.questions.every((q) => m[q.id] != null);
  }

  /** Time ran out but not every question is answered — submit stays disabled until complete. */
  timeUpIncomplete(): boolean {
    const p = this.paper();
    return (
      this.timeExpired() &&
      !this.submitted() &&
      p != null &&
      !this.canSubmit(p)
    );
  }

  submit(): void {
    const p = this.paper();
    const sid = this.sessionId();
    if (!p || sid == null) return;
    if (!this.canSubmit(p)) {
      this.errorMsg.set('Answer every question before submitting.');
      return;
    }
    this.errorMsg.set(null);
    const selections = p.questions.map((q) => ({
      questionId: q.id,
      answerChoiceId: this.picks()[q.id]!,
    }));
    this.loading.set(true);
    this.api.submit(sid, selections).subscribe({
      next: (res) => {
        this.stopQuizTimer();
        this.loading.set(false);
        this.submitted.set(true);
        this.scorePercent.set(res.scorePercent ?? null);
        if (res.integrityViolation === true) {
          this.integrityViolation.set(true);
        }
        this.assessmentNotif.refreshCandidate();
      },
      error: (err: unknown) => {
        this.loading.set(false);
        if (this.timeExpired()) {
          this.timeUpAutoSubmitDone = false;
        }
        this.errorMsg.set(this.formatErr(err));
      },
    });
  }

  trackByQ(_i: number, q: QuestionPaperItemDto): number {
    return q.id;
  }

  private formatErr(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const b = err.error;
      if (typeof b === 'string' && b.trim()) return b;
      if (b && typeof b === 'object' && 'message' in b) {
        return String((b as { message: unknown }).message);
      }
      return err.message || `Error ${err.status}`;
    }
    return 'Something went wrong.';
  }
}
