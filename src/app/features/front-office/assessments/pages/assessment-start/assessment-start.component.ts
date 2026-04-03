import { Component, NgZone, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import {
  CodingAssessmentService,
  StartCodingSessionRequest,
  formatAssessmentHttpError,
} from '../../services/coding-assessment.service';
import { ASSESSMENT_PLACEHOLDER_USER_ID } from '../../assessment-placeholder-user';

/** Assessment track — what dimension the candidate wants to run */
export type AssessmentTrackMode = 'coding' | 'quiz' | 'language';

/**
 * Assessment Start Page — pick coding, quiz, or language.
 */
@Component({
  selector: 'app-assessment-start',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assessment-start.component.html',
  styleUrl: './assessment-start.component.scss'
})
export class AssessmentStartComponent implements OnInit {
  loading = signal(false);
  /** Shown on the page — avoids relying on `alert()` (easy to miss or block). */
  errorMessage = signal<string | null>(null);
  selectedTrack = signal<string | null>(null);

  assessmentCategories: {
    id: string;
    title: string;
    description: string;
    icon: string;
    duration: string;
    tasks: string;
    color: string;
    mode: AssessmentTrackMode;
  }[] = [
    {
      id: 'CODING',
      title: 'Coding',
      description: 'Dynamic programming tasks, Judge0 execution, tests, and adaptive difficulty.',
      icon: '💻',
      duration: '15–25 min',
      tasks: '5–10',
      color: 'blue',
      mode: 'coding',
    },
    {
      id: 'QUIZ',
      title: 'Quiz',
      description: 'Technical MCQ and short answers — AI-generated, no static question bank.',
      icon: '📝',
      duration: '10–20 min',
      tasks: '3–8',
      color: 'green',
      mode: 'quiz',
    },
    {
      id: 'LANGUAGE',
      title: 'Language',
      description: 'Grammar, vocabulary, and short writing — scored with LanguageTool and AI rubrics.',
      icon: '🌐',
      duration: '10–20 min',
      tasks: '3–8',
      color: 'purple',
      mode: 'language',
    },
  ];

  private readonly ngZone = inject(NgZone);

  constructor(
    private codingAssessment: CodingAssessmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize component
  }

  selectTrack(trackId: string): void {
    this.selectedTrack.set(trackId);
  }

  /** Stops the card container from stealing the button click */
  onStartClick(cat: (typeof this.assessmentCategories)[number], event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.startAssessment(cat);
  }

  startAssessment(category: (typeof this.assessmentCategories)[number]): void {
    if (this.loading()) {
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);

    const userId = ASSESSMENT_PLACEHOLDER_USER_ID;

    const navigate = (commands: (string | number)[]): void => {
      this.ngZone.run(() => {
        void this.router.navigate(commands).then((ok) => {
          if (!ok) {
            this.errorMessage.set('Navigation was blocked. Try again or check the console.');
          }
        });
      });
    };

    if (category.mode === 'coding') {
      const request: StartCodingSessionRequest = {
        userId,
        skill: 'GENERAL',
        level: 'INTERMEDIATE',
        targetTaskCount: 7,
      };
      this.codingAssessment
        .startSession(request)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (session) => {
            const id = this.sessionIdFromResponse(session);
            if (id == null || Number.isNaN(Number(id))) {
              this.errorMessage.set('Invalid session from server. Check MS-Assessment logs and database mapping.');
              return;
            }
            this.codingAssessment.setActiveSession(session);
            navigate(['/dashboard/assessment/questions', String(id)]);
          },
          error: (err) => {
            console.error('Error starting assessment:', err);
            this.errorMessage.set(formatAssessmentHttpError(err));
          },
        });
      return;
    }

    const tracks = category.mode === 'quiz' ? ['QUIZ'] : ['LANGUAGE'];
    const multiRequest: StartCodingSessionRequest = {
      userId,
      skill: 'GENERAL',
      level: 'MID',
      tracks,
      quizQuestionCount: category.mode === 'quiz' ? 5 : 0,
      languageQuestionCount: category.mode === 'language' ? 5 : 0,
      codingTaskCount: 0,
    };

    this.codingAssessment
      .startSession(multiRequest)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (session) => {
          const id = this.sessionIdFromResponse(session);
          if (id == null || Number.isNaN(Number(id))) {
            this.errorMessage.set('Invalid session from server.');
            return;
          }
          navigate(['/dashboard/assessment/unified', String(id)]);
        },
        error: (err) => {
          console.error('Error starting track assessment:', err);
          this.errorMessage.set(formatAssessmentHttpError(err));
        },
      });
  }

  dismissError(): void {
    this.errorMessage.set(null);
  }

  private sessionIdFromResponse(session: { id?: number; sessionId?: number } | null | undefined): number | undefined {
    const raw = session?.id ?? session?.sessionId;
    if (raw == null || Number.isNaN(Number(raw))) {
      return undefined;
    }
    return Number(raw);
  }
}
