import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LUCIDE_ICONS } from '../../../../../shared/lucide-icons';
import { RoadmapApiService } from '../../../../../services/roadmap-api.service';

/* ── Types ── */
interface SessionQuestion {
  id: number;
  text: string;
  context?: string;
  category: 'technical' | 'behavioral';
  difficulty: string;
  difficultyColor: string;
}

interface DimensionScore {
  label: string;
  score: number;
  color: string;
}

@Component({
  selector: 'app-interview-session',
  standalone: true,
  imports: [CommonModule, FormsModule, LUCIDE_ICONS],
  templateUrl: './interview-session.component.html',
  styleUrl: './interview-session.component.scss'
})
export class InterviewSessionComponent implements OnInit, OnDestroy {
  private readonly roadmapApi = inject(RoadmapApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  sessionId = signal<number | null>(null);

  mode = signal<'practice' | 'test'>('practice');
  totalQuestions = 0;
  currentIndex = signal(0);

  /* ── Timer ── */
  elapsedSeconds = signal(0);
  private timerInterval: any = null;

  /* ── Questions ── */
  questions: SessionQuestion[] = [];
  currentQuestionData = signal<SessionQuestion | null>(null);

  /* ── Answer state ── */
  answerText = signal('');
  showHint = signal(false);

  /* ── Feedback state (Practice mode) ── */
  feedbackState = signal<'idle' | 'loading' | 'ready'>('idle');
  overallScore = signal(0);
  dimensionScores = signal<DimensionScore[]>([]);
  strengths = signal<string[]>([]);
  improvements = signal<string[]>([]);

  /* ── Exit dialog ── */
  showExitDialog = signal(false);

  /* ── Session complete ── */
  sessionComplete = signal(false);
  finalScore = signal(0);
  percentile = signal(0);

  /* ── Transition ── */
  transitioning = signal(false);

  currentQuestion = computed(() => this.currentQuestionData() || this.emptyQuestion());
  currentQuote = computed(() => {
    const text = this.currentQuestion().text || '';
    if (!text) {
      return 'Stay focused. Give concise, structured answers.';
    }
    return `Focus prompt: ${text}`;
  });

  formattedTime = computed(() => {
    const s = this.elapsedSeconds();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  });

  charCount = computed(() => this.answerText().length);

  ngOnInit(): void {
    const sessionIdParam = this.route.snapshot.paramMap.get('id');
    const parsedSessionId = sessionIdParam ? Number(sessionIdParam) : NaN;
    if (!Number.isFinite(parsedSessionId) || parsedSessionId <= 0) {
      this.showExitDialog.set(true);
      return;
    }

    this.sessionId.set(parsedSessionId);

    const modeParam = (this.route.snapshot.queryParamMap.get('mode') || '').toLowerCase();
    if (modeParam === 'test' || modeParam === 'practice') {
      this.mode.set(modeParam);
    }

    this.startTimer();
    this.loadNextQuestion();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds.update(v => v + 1);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  toggleHint(): void {
    this.showHint.update(v => !v);
  }

  submitAnswer(): void {
    const sessionId = this.sessionId();
    if (!sessionId || this.answerText().trim().length === 0) {
      return;
    }

    this.feedbackState.set('loading');
    this.roadmapApi.submitInterviewAnswer(sessionId, this.answerText().trim()).subscribe({
      next: (result) => {
        if (this.mode() === 'practice') {
          const overall = this.normalizeScore(result.score);
          this.overallScore.set(overall);
          this.dimensionScores.set(this.buildDimensionScores(overall));
          const feedback = this.extractFeedback(result.evaluation);
          this.strengths.set(feedback ? [feedback] : []);
          this.improvements.set([]);
          this.feedbackState.set('ready');
        } else {
          this.feedbackState.set('idle');
          this.goNext();
        }

        if (result.completed) {
          this.finishSession();
        }
      },
      error: () => {
        this.feedbackState.set('idle');
      },
    });
  }

  retryQuestion(): void {
    this.answerText.set('');
    this.showHint.set(false);
    this.feedbackState.set('idle');
  }

  goNext(): void {
    this.transitioning.set(true);
    setTimeout(() => {
      this.answerText.set('');
      this.showHint.set(false);
      this.feedbackState.set('idle');
      this.transitioning.set(false);
      this.loadNextQuestion();
    }, 800);
  }

  requestExit(): void {
    this.showExitDialog.set(true);
  }

  cancelExit(): void {
    this.showExitDialog.set(false);
  }

  confirmExit(): void {
    this.showExitDialog.set(false);
    void this.router.navigate(['/dashboard/interview']);
  }

  viewReport(): void {
    const sessionId = this.sessionId();
    if (!sessionId) {
      return;
    }
    void this.router.navigate(['/dashboard/interview/report', sessionId]);
  }

  backToHub(): void {
    void this.router.navigate(['/dashboard/interview']);
  }

  private loadNextQuestion(): void {
    const sessionId = this.sessionId();
    if (!sessionId) {
      return;
    }

    this.roadmapApi.getInterviewQuestion(sessionId).subscribe({
      next: (question) => {
        const total = question.total || this.totalQuestions || 0;
        this.totalQuestions = total;
        this.questions = Array.from({ length: total }, (_, index) => this.placeholderQuestion(index + 1));

        const order = question.order || question.id || this.currentIndex() + 1;
        this.currentIndex.set(Math.max(0, order - 1));

        const text = question.question || question.text || `Question ${order}`;
        this.currentQuestionData.set({
          id: Number(question.id || order),
          text,
          category: 'technical',
          difficulty: this.formatDifficulty(this.mode() === 'test' ? 'hard' : 'intermediate'),
          difficultyColor: this.mode() === 'test' ? '#ef4444' : '#f59e0b',
        });
      },
      error: () => {
        this.finishSession();
      },
    });
  }

  private finishSession(): void {
    const sessionId = this.sessionId();
    if (!sessionId) {
      return;
    }

    this.roadmapApi.getInterviewScore(sessionId).subscribe({
      next: (score) => {
        this.stopTimer();
        this.finalScore.set(this.normalizeScore(score.finalScore));
        this.percentile.set(50);
        this.sessionComplete.set(true);
      },
      error: () => {
        this.stopTimer();
        this.sessionComplete.set(true);
      },
    });
  }

  private normalizeScore(score: number | undefined): number {
    if (typeof score !== 'number') {
      return 0;
    }
    return Number(Math.max(0, Math.min(10, score)).toFixed(1));
  }

  private buildDimensionScores(score: number): DimensionScore[] {
    const ratio = Math.round((score / 10) * 100);
    return [
      { label: 'Content', score: ratio, color: '#2ee8a5' },
      { label: 'Clarity', score: Math.max(0, ratio - 4), color: '#3b82f6' },
      { label: 'Confidence', score: Math.max(0, ratio - 8), color: '#10b981' },
      { label: 'Tone', score: Math.max(0, ratio - 2), color: '#8b5cf6' },
      { label: 'Non-verbal', score: Math.max(0, ratio - 12), color: '#f59e0b' },
    ];
  }

  private extractFeedback(evaluation: string | undefined): string {
    if (!evaluation) {
      return '';
    }
    const marker = 'Feedback:';
    const idx = evaluation.indexOf(marker);
    if (idx === -1) {
      return evaluation;
    }
    return evaluation.substring(idx + marker.length).trim();
  }

  private formatDifficulty(value: string): string {
    if (!value) {
      return 'Intermediate';
    }
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  private placeholderQuestion(id: number): SessionQuestion {
    return {
      id,
      text: '',
      category: 'technical',
      difficulty: 'Intermediate',
      difficultyColor: '#f59e0b',
    };
  }

  private emptyQuestion(): SessionQuestion {
    return {
      id: 0,
      text: '',
      category: 'technical',
      difficulty: 'Intermediate',
      difficultyColor: '#f59e0b',
    };
  }
}
