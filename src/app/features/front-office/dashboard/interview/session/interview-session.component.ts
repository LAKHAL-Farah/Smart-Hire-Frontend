import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LUCIDE_ICONS } from '../../../../../shared/lucide-icons';
import { InterviewApiService } from '../interview-api.service';
import {
  AnswerEvaluationDto,
  InterviewQuestionDto,
  InterviewSessionDto,
  SessionQuestionOrderDto,
} from '../interview.models';

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 30;
const TIMER_RADIUS = 54;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

@Component({
  selector: 'app-interview-session',
  standalone: true,
  imports: [CommonModule, FormsModule, LUCIDE_ICONS],
  templateUrl: './interview-session.component.html',
  styleUrl: './interview-session.component.scss'
})
export class InterviewSessionComponent implements OnInit, OnDestroy {
  private readonly api = inject(InterviewApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private sessionId = 0;
  private elapsedTimerRef: ReturnType<typeof setInterval> | null = null;
  private questionTimerRef: ReturnType<typeof setInterval> | null = null;
  private scoreAnimRef: ReturnType<typeof setInterval> | null = null;

  readonly session = signal<InterviewSessionDto | null>(null);
  readonly questionOrders = signal<SessionQuestionOrderDto[]>([]);
  readonly currentQuestion = signal<InterviewQuestionDto | null>(null);
  readonly currentIndex = signal(0);
  readonly answerText = signal('');
  readonly isAnswerFocused = signal(false);
  readonly isSubmitting = signal(false);
  readonly isLoaded = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly hintOpen = signal(false);
  readonly feedbackOpen = signal(false);
  readonly feedbackEvaluation = signal<AnswerEvaluationDto | null>(null);
  readonly animatedScore = signal(0);
  readonly lastAnswerId = signal<number | null>(null);
  readonly idealExpanded = signal(false);
  readonly idealReveal = signal(false);

  readonly followUpInputOpen = signal(false);
  readonly showFollowUpDialog = signal(false);
  readonly followUpText = signal('');
  readonly followUpBusy = signal(false);
  readonly followUpState = signal<string | null>(null);

  readonly showAbandonConfirm = signal(false);

  readonly elapsedSeconds = signal(0);
  readonly countdownTotal = signal(120);
  readonly countdownLeft = signal(120);

  readonly isPractice = computed(() => this.session()?.mode === 'PRACTICE');
  readonly isTest = computed(() => this.session()?.mode === 'TEST');
  readonly totalQuestions = computed(() => this.questionOrders().length);
  readonly questionPositionLabel = computed(() => {
    const total = this.totalQuestions();
    if (!total) {
      return 'Q0 of 0';
    }
    return `Q${Math.min(this.currentIndex() + 1, total)} of ${total}`;
  });
  readonly progressPercent = computed(() => {
    const total = this.totalQuestions();
    if (!total) {
      return 0;
    }

    return (Math.min(this.currentIndex() + 1, total) / total) * 100;
  });
  readonly characterCount = computed(() => this.answerText().length);
  readonly avatarStatus = computed(() => {
    if (this.isSubmitting()) {
      return 'Thinking...';
    }

    if (this.isAnswerFocused()) {
      return 'Listening...';
    }

    return 'Ready for your answer';
  });
  readonly phaseLabel = computed(() => this.currentQuestion()?.type ?? 'TECHNICAL');
  readonly hints = computed(() => this.parseJsonArray(this.currentQuestion()?.hints));
  readonly expectedPoints = computed(() => this.parseJsonArray(this.currentQuestion()?.expectedPoints));
  readonly timerRingOffset = computed(() => {
    if (!this.isTest()) {
      return TIMER_CIRCUMFERENCE;
    }

    const total = this.countdownTotal() || 1;
    const ratio = Math.max(0, Math.min(1, this.countdownLeft() / total));
    return TIMER_CIRCUMFERENCE * (1 - ratio);
  });
  readonly timerDisplay = computed(() => {
    const value = this.isTest() ? this.countdownLeft() : this.elapsedSeconds();
    return this.toClock(value);
  });
  readonly scoreTextColor = computed(() => {
    const score = this.feedbackEvaluation()?.overallScore ?? 0;
    if (score < 5) {
      return '#ef4444';
    }
    if (score <= 7) {
      return '#f59e0b';
    }
    return '#22c55e';
  });
  readonly contentScoreLabel = computed(() => {
    const score = this.feedbackEvaluation()?.contentScore;
    return score === null || score === undefined ? '--' : score.toFixed(1);
  });

  readonly timerRadius = TIMER_RADIUS;
  readonly timerCircumference = TIMER_CIRCUMFERENCE;

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = Number(rawId);
    if (!Number.isFinite(id)) {
      this.loadError.set('Invalid session id.');
      return;
    }

    this.sessionId = id;
    this.bootstrapSession();
  }

  ngOnDestroy(): void {
    this.clearIntervals();
  }

  async submitAnswer(isAutoSubmit = false): Promise<void> {
    if (this.isSubmitting()) {
      return;
    }

    const currentQuestion = this.currentQuestion();
    if (!currentQuestion) {
      return;
    }

    const typed = this.answerText().trim();
    if (!typed && !isAutoSubmit) {
      return;
    }

    this.isSubmitting.set(true);
    this.hintOpen.set(false);
    this.followUpInputOpen.set(false);
    this.showFollowUpDialog.set(false);
    this.followUpState.set(null);

    try {
      const submitResponse = await firstValueFrom(
        this.api.submitAnswer({
          sessionId: this.sessionId,
          questionId: currentQuestion.id,
          answerText: typed || 'No answer provided.',
        })
      );

      this.lastAnswerId.set(submitResponse.id);

      await firstValueFrom(this.api.triggerEvaluation(submitResponse.id));
      const evaluation = await this.pollEvaluation(submitResponse.id);

      if (this.isPractice()) {
        this.feedbackEvaluation.set(evaluation);
        this.openFeedbackDrawer();
      } else {
        await this.advanceSessionOrComplete();
      }
    } catch {
      this.loadError.set('Unable to submit answer. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async tryAgain(): Promise<void> {
    const question = this.currentQuestion();
    if (!question) {
      return;
    }

    try {
      await firstValueFrom(
        this.api.retryAnswer({
          sessionId: this.sessionId,
          questionId: question.id,
          answerText: this.answerText(),
        })
      );
    } catch {
      this.loadError.set('Retry request failed. You can still continue.');
    }

    this.answerText.set('');
    this.feedbackOpen.set(false);
    this.feedbackEvaluation.set(null);
    this.idealExpanded.set(false);
    this.idealReveal.set(false);
    this.showFollowUpDialog.set(false);
  }

  async nextQuestion(): Promise<void> {
    this.feedbackOpen.set(false);
    this.feedbackEvaluation.set(null);
    this.idealExpanded.set(false);
    this.idealReveal.set(false);
    this.followUpInputOpen.set(false);
    this.showFollowUpDialog.set(false);
    this.followUpText.set('');
    this.followUpState.set(null);
    await this.advanceSessionOrComplete();
  }

  toggleHint(): void {
    this.hintOpen.update((isOpen) => !isOpen);
  }

  requestAbandon(): void {
    this.showAbandonConfirm.set(true);
  }

  cancelAbandon(): void {
    this.showAbandonConfirm.set(false);
  }

  async confirmAbandon(): Promise<void> {
    this.showAbandonConfirm.set(false);
    try {
      await firstValueFrom(this.api.abandonSession(this.sessionId));
      this.router.navigate(['/dashboard/interview']);
    } catch {
      this.loadError.set('Could not abandon this session right now.');
    }
  }

  toggleIdeal(): void {
    this.idealExpanded.update((value) => !value);
  }

  toggleIdealReveal(): void {
    this.idealReveal.update((value) => !value);
  }

  openFollowUpInput(): void {
    this.followUpInputOpen.set(true);
    this.showFollowUpDialog.set(true);
    this.followUpState.set(null);
  }

  closeFollowUpInput(): void {
    this.showFollowUpDialog.set(false);
  }

  async submitFollowUp(): Promise<void> {
    const question = this.currentQuestion();
    const parentAnswerId = this.lastAnswerId();
    const answerText = this.followUpText().trim();

    if (!question || !parentAnswerId || !answerText || this.followUpBusy()) {
      return;
    }

    this.followUpBusy.set(true);
    this.followUpState.set(null);

    try {
      const submitted = await firstValueFrom(
        this.api.submitFollowUp({
          sessionId: this.sessionId,
          questionId: question.id,
          parentAnswerId,
          answerText,
        })
      );

      await firstValueFrom(this.api.triggerEvaluation(submitted.id));
      const followUpEvaluation = await this.pollEvaluation(submitted.id);
      this.followUpState.set(
        followUpEvaluation.overallScore === null
          ? 'Follow-up submitted.'
          : `Follow-up evaluated: ${followUpEvaluation.overallScore.toFixed(1)} / 10`
      );
      this.followUpText.set('');
      this.showFollowUpDialog.set(false);
    } catch {
      this.followUpState.set('Unable to evaluate follow-up right now.');
    } finally {
      this.followUpBusy.set(false);
    }
  }

  getPhaseClass(type: string | undefined): string {
    switch (type) {
      case 'BEHAVIORAL':
        return 'phase-behavioral';
      case 'TECHNICAL':
        return 'phase-technical';
      case 'SITUATIONAL':
        return 'phase-situational';
      default:
        return 'phase-coding';
    }
  }

  getDifficultyClass(level: string | undefined): string {
    switch (level) {
      case 'BEGINNER':
        return 'difficulty-beginner';
      case 'INTERMEDIATE':
        return 'difficulty-intermediate';
      case 'ADVANCED':
        return 'difficulty-advanced';
      default:
        return 'difficulty-expert';
    }
  }

  getTimerToneClass(): string {
    if (!this.isTest()) {
      return 'tone-practice';
    }

    if (this.countdownLeft() <= 10) {
      return 'tone-danger';
    }

    if (this.countdownLeft() <= 30) {
      return 'tone-warning';
    }

    return 'tone-normal';
  }

  private bootstrapSession(): void {
    this.loadError.set(null);

    Promise.all([
      firstValueFrom(this.api.getSessionById(this.sessionId)),
      firstValueFrom(this.api.getCurrentSessionQuestion(this.sessionId)),
      firstValueFrom(this.api.getSessionQuestionOrder(this.sessionId)),
    ])
      .then(([session, currentQuestion, questionOrders]) => {
        this.session.set(session);
        this.currentQuestion.set(currentQuestion);
        this.questionOrders.set(questionOrders);
        this.currentIndex.set(this.resolveCurrentIndex(session, questionOrders, currentQuestion));
        this.isLoaded.set(true);
        this.startElapsedTimer();
        this.configureQuestionTimer();
      })
      .catch(() => {
        this.loadError.set('Failed to load the interview room.');
      });
  }

  private async advanceSessionOrComplete(): Promise<void> {
    try {
      const currentQuestion = await firstValueFrom(this.api.getCurrentSessionQuestion(this.sessionId));
      const [session, questionOrders] = await Promise.all([
        firstValueFrom(this.api.getSessionById(this.sessionId)),
        firstValueFrom(this.api.getSessionQuestionOrder(this.sessionId)),
      ]);

      this.session.set(session);
      this.questionOrders.set(questionOrders);
      this.currentQuestion.set(currentQuestion);
      this.currentIndex.set(this.resolveCurrentIndex(session, questionOrders, currentQuestion));
      this.answerText.set('');
      this.configureQuestionTimer();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        await this.completeAndGenerateReport();
        return;
      }

      this.loadError.set('Could not move to the next question.');
    }
  }

  private async completeAndGenerateReport(): Promise<void> {
    try {
      await firstValueFrom(this.api.completeSession(this.sessionId));
      const report = await firstValueFrom(this.api.generateReport(this.sessionId));
      this.router.navigate(['/dashboard/interview/report', report.id]);
    } catch {
      this.loadError.set('Session completed but report generation failed.');
      this.router.navigate(['/dashboard/interview']);
    }
  }

  private async pollEvaluation(answerId: number): Promise<AnswerEvaluationDto> {
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      try {
        const evaluation = await firstValueFrom(this.api.getEvaluationByAnswer(answerId));
        if (evaluation.overallScore !== null) {
          return evaluation;
        }
      } catch {
        // Keep polling while async evaluation is still running.
      }

      await this.sleep(POLL_INTERVAL_MS);
    }

    throw new Error('Evaluation polling timeout');
  }

  private openFeedbackDrawer(): void {
    this.feedbackOpen.set(true);
    this.animatedScore.set(0);
    this.idealExpanded.set(false);
    this.idealReveal.set(false);

    const target = this.feedbackEvaluation()?.overallScore ?? 0;
    const steps = 20;
    const increment = target / steps;
    let currentStep = 0;

    if (this.scoreAnimRef) {
      clearInterval(this.scoreAnimRef);
    }

    this.scoreAnimRef = setInterval(() => {
      currentStep += 1;
      this.animatedScore.set(Math.min(target, Number((increment * currentStep).toFixed(1))));

      if (currentStep >= steps) {
        clearInterval(this.scoreAnimRef!);
        this.scoreAnimRef = null;
      }
    }, 35);
  }

  private resolveCurrentIndex(
    session: InterviewSessionDto,
    questionOrders: SessionQuestionOrderDto[],
    currentQuestion: InterviewQuestionDto
  ): number {
    const fromQuestion = questionOrders.find((order) => order.questionId === currentQuestion.id)?.questionOrder;
    if (fromQuestion !== undefined) {
      return fromQuestion;
    }

    if (session.currentQuestionIndex >= 0 && session.currentQuestionIndex < questionOrders.length) {
      return session.currentQuestionIndex;
    }

    return 0;
  }

  private startElapsedTimer(): void {
    if (this.elapsedTimerRef) {
      clearInterval(this.elapsedTimerRef);
    }

    this.elapsedTimerRef = setInterval(() => {
      this.elapsedSeconds.update((value) => value + 1);
    }, 1000);
  }

  private configureQuestionTimer(): void {
    if (this.questionTimerRef) {
      clearInterval(this.questionTimerRef);
      this.questionTimerRef = null;
    }

    if (!this.isTest()) {
      return;
    }

    const currentOrder = this.questionOrders().find((order) => order.questionOrder === this.currentIndex());
    const allotted = currentOrder?.timeAllottedSeconds ?? 120;
    this.countdownTotal.set(allotted);
    this.countdownLeft.set(allotted);

    this.questionTimerRef = setInterval(() => {
      const next = this.countdownLeft() - 1;
      this.countdownLeft.set(Math.max(0, next));

      if (next <= 0) {
        clearInterval(this.questionTimerRef!);
        this.questionTimerRef = null;
        this.submitAnswer(true);
      }
    }, 1000);
  }

  private parseJsonArray(raw: string | null | undefined): string[] {
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry));
      }
      return [String(parsed)];
    } catch {
      return [raw];
    }
  }

  toClock(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private clearIntervals(): void {
    if (this.elapsedTimerRef) {
      clearInterval(this.elapsedTimerRef);
    }
    if (this.questionTimerRef) {
      clearInterval(this.questionTimerRef);
    }
    if (this.scoreAnimRef) {
      clearInterval(this.scoreAnimRef);
    }

    this.elapsedTimerRef = null;
    this.questionTimerRef = null;
    this.scoreAnimRef = null;
  }
}
