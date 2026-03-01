import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS } from '../../../../../shared/lucide-icons';

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
  /* ── Session config ── */
  mode = signal<'practice' | 'test'>('practice');
  totalQuestions = 8;
  currentIndex = signal(0);

  /* ── Timer ── */
  elapsedSeconds = signal(0);
  private timerInterval: any = null;

  /* ── Questions ── */
  questions: SessionQuestion[] = [
    { id: 1, text: 'Explain the difference between a stack and a queue. When would you choose one over the other?', category: 'technical', difficulty: 'Intermediate', difficultyColor: '#f59e0b' },
    { id: 2, text: 'Tell me about a time you had to resolve a conflict within your team. What was your approach and what was the outcome?', category: 'behavioral', difficulty: 'Easy', difficultyColor: '#10b981' },
    { id: 3, text: 'How would you design a rate limiter for an API that handles 10,000 requests per second?', category: 'technical', difficulty: 'Hard', difficultyColor: '#ef4444' },
    { id: 4, text: 'Walk me through how you would optimize a slow database query that involves multiple JOINs.', category: 'technical', difficulty: 'Intermediate', difficultyColor: '#f59e0b' },
    { id: 5, text: 'Describe a situation where you had to learn a new technology quickly to meet a deadline.', category: 'behavioral', difficulty: 'Easy', difficultyColor: '#10b981' },
    { id: 6, text: 'What is the difference between horizontal and vertical scaling? Give examples of when each is appropriate.', category: 'technical', difficulty: 'Intermediate', difficultyColor: '#f59e0b' },
    { id: 7, text: 'How do you handle disagreements about technical decisions with senior engineers?', category: 'behavioral', difficulty: 'Intermediate', difficultyColor: '#f59e0b' },
    { id: 8, text: 'Implement a function that detects a cycle in a linked list. Explain the time and space complexity of your solution.', category: 'technical', difficulty: 'Hard', difficultyColor: '#ef4444' },
  ];

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

  /* ── Test mode quotes ── */
  quotes = [
    '"First, solve the problem. Then, write the code." — John Johnson',
    '"The best way to predict the future is to implement it." — David Heinemeier Hansson',
    '"Code is like humor. When you have to explain it, it is bad." — Cory House',
    '"Simplicity is the soul of efficiency." — Austin Freeman',
    '"Talk is cheap. Show me the code." — Linus Torvalds',
    '"Programs must be written for people to read, and only incidentally for machines to execute." — Harold Abelson',
    '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler',
    '"The only way to go fast is to go well." — Robert C. Martin',
  ];

  currentQuestion = computed(() => this.questions[this.currentIndex()]);
  currentQuote = computed(() => this.quotes[this.currentIndex() % this.quotes.length]);

  formattedTime = computed(() => {
    const s = this.elapsedSeconds();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  });

  charCount = computed(() => this.answerText().length);

  ngOnInit(): void {
    this.startTimer();
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
    if (this.mode() === 'practice') {
      this.feedbackState.set('loading');
      // Simulate AI analysis delay
      setTimeout(() => {
        this.overallScore.set(7.4);
        this.dimensionScores.set([
          { label: 'Content', score: 82, color: '#2ee8a5' },
          { label: 'Clarity', score: 74, color: '#3b82f6' },
          { label: 'Confidence', score: 68, color: '#10b981' },
          { label: 'Tone', score: 78, color: '#8b5cf6' },
          { label: 'Non-verbal', score: 55, color: '#f59e0b' },
        ]);
        this.strengths.set([
          'Clear structure with well-defined examples',
          'Good use of technical terminology',
          'Confident opening statement',
        ]);
        this.improvements.set([
          'Could elaborate more on edge cases',
          'Consider adding a real-world analogy',
        ]);
        this.feedbackState.set('ready');
      }, 2500);
    } else {
      this.goNext();
    }
  }

  retryQuestion(): void {
    this.answerText.set('');
    this.showHint.set(false);
    this.feedbackState.set('idle');
  }

  goNext(): void {
    const nextIdx = this.currentIndex() + 1;
    if (nextIdx >= this.totalQuestions) {
      this.stopTimer();
      this.finalScore.set(7.8);
      this.percentile.set(68);
      this.sessionComplete.set(true);
      return;
    }

    this.transitioning.set(true);
    setTimeout(() => {
      this.currentIndex.set(nextIdx);
      this.answerText.set('');
      this.showHint.set(false);
      this.feedbackState.set('idle');
      this.transitioning.set(false);
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
    // Navigate back to hub — in real app use Router
    window.history.back();
  }

  viewReport(): void {
    console.log('Navigate to report');
  }

  backToHub(): void {
    window.history.back();
  }
}
