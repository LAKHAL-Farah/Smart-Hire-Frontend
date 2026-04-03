import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  AssessmentService, 
  AssessmentSessionResponse, 
  QuestionResponse, 
  AnswerSubmissionResponse,
  SubmitAnswerRequest 
} from '../../services/assessment.service';

/**
 * Assessment Host Page Component
 * Main Q&A workflow component with CAT question delivery
 */
@Component({
  selector: 'app-assessment-host',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assessment-host.component.html',
  styleUrl: './assessment-host.component.scss'
})
export class AssessmentHostComponent implements OnInit, OnDestroy {
  sessionId: number = 0;
  session = signal<AssessmentSessionResponse | null>(null);
  currentQuestion = signal<QuestionResponse | null>(null);
  userAnswer = signal<string>('');
  isLoading = signal(false);
  isSubmitting = signal(false);
  showFeedback = signal(false);
  feedback = signal<string>('');
  score = signal<number>(0);
  isCorrect = signal<boolean>(false);
  timeTaken = signal<number>(0);
  timerInterval: any;

  private destroy$ = new Subject<void>();

  constructor(
    private assessmentService: AssessmentService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('sessionId'));
    if (!this.sessionId) {
      this.router.navigate(['/dashboard/assessment/start']);
      return;
    }

    this.loadAssessmentProgress();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAssessmentProgress(): void {
    this.isLoading.set(true);
    this.assessmentService.getSessionProgress(this.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (session) => {
          this.session.set(session);
          this.currentQuestion.set(session.currentQuestion);
          this.isLoading.set(false);
          this.startTimer();
        },
        error: (err) => {
          console.error('Error loading assessment:', err);
          this.isLoading.set(false);
          alert('Failed to load assessment');
          this.router.navigate(['/dashboard/assessment/start']);
        }
      });
  }

  startTimer(): void {
    let seconds = 0;
    this.timerInterval = setInterval(() => {
      seconds++;
      this.timeTaken.set(seconds);
    }, 1000);
  }

  submitAnswer(): void {
    if (!this.userAnswer()) {
      alert('Please provide an answer');
      return;
    }

    this.isSubmitting.set(true);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    const request: SubmitAnswerRequest = {
      sessionId: this.sessionId,
      questionId: this.currentQuestion()?.id || 0,
      userAnswer: this.userAnswer(),
      timeTakenSeconds: this.timeTaken()
    };

    this.assessmentService.submitAnswer(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AnswerSubmissionResponse) => {
          this.isSubmitting.set(false);
          this.isCorrect.set(response.isCorrect);
          this.score.set(response.score);
          this.feedback.set(response.feedback);
          this.showFeedback.set(true);

          // If assessment is completed, redirect to results
          if (response.sessionCompleted) {
            setTimeout(() => {
              this.router.navigate(['/dashboard/assessment/results', this.sessionId]);
            }, 2000);
          } else {
            // Show next question after delay
            setTimeout(() => {
              this.currentQuestion.set(response.nextQuestion);
              this.userAnswer.set('');
              this.showFeedback.set(false);
              this.timeTaken.set(0);
              this.startTimer();
            }, 2000);
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Error submitting answer:', err);
          alert('Failed to submit answer');
        }
      });
  }

  skipQuestion(): void {
    this.userAnswer.set('');
    this.submitAnswer();
  }

  abandonAssessment(): void {
    if (confirm('Are you sure you want to abandon this assessment?')) {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      this.assessmentService.abandonAssessment(this.sessionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.router.navigate(['/dashboard/assessment/start']);
          },
          error: (err) => {
            console.error('Error abandoning assessment:', err);
            alert('Failed to abandon assessment');
          }
        });
    }
  }

  getProgressPercentage(): number {
    if (!this.session()) return 0;
    const s = this.session()!;
    const total = 15;
    return Math.round((s.questionCount / total) * 100);
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D, etc
  }
}
