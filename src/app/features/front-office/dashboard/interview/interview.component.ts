import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';
import {
  CareerPathOptionDto,
  InterviewSessionDto,
  RoadmapApiService,
} from '../../../../services/roadmap-api.service';
import { resolveRoadmapUserId } from '../roadmap/roadmap-user-context';

interface SessionHistory {
  id: string;
  mode: 'practice' | 'test';
  questionType: string;
  careerPath: string;
  date: string;
  score: number;
}

type QuestionType = 'technical' | 'behavioral' | 'mixed';
type Difficulty = 'beginner' | 'easy' | 'intermediate' | 'hard' | 'expert';

@Component({
  selector: 'app-interview',
  standalone: true,
  imports: [CommonModule, LUCIDE_ICONS],
  templateUrl: './interview.component.html',
  styleUrl: './interview.component.scss',
})
export class InterviewComponent implements OnInit {
  private readonly roadmapApi = inject(RoadmapApiService);
  private readonly router = inject(Router);

  userId = signal<number | null>(null);
  loading = signal(false);
  creatingSession = signal(false);
  errorMessage = signal<string | null>(null);

  sessionActive = signal(false);
  showModal = signal(false);
  selectedMode = signal<'practice' | 'test'>('practice');

  questionType = signal<QuestionType>('technical');
  careerPath = signal('');
  difficulty = signal<Difficulty>('intermediate');
  questionCount = signal(10);
  videoEnabled = signal(false);
  cameraGranted = signal(false);

  questionTypes: { label: string; value: QuestionType }[] = [
    { label: 'Technical', value: 'technical' },
    { label: 'Behavioral', value: 'behavioral' },
    { label: 'Mixed', value: 'mixed' },
  ];

  careerPaths: { value: string; label: string; emoji: string }[] = [];
  difficulties: Difficulty[] = ['beginner', 'easy', 'intermediate', 'hard', 'expert'];
  questionCounts = [5, 10, 15];

  streak = 0;
  bestStreak = 0;
  avgScore = 0;
  scoreTrend = '0.0';
  sessionsThisMonth = 0;
  lastSession = 'N/A';

  sessions: SessionHistory[] = [];

  selectedCareerPath = computed(() => this.careerPaths.find((c) => c.value === this.careerPath()));
  difficultyIndex = computed(() => this.difficulties.indexOf(this.difficulty()));

  ngOnInit(): void {
    const userId = resolveRoadmapUserId();
    this.userId.set(userId);

    if (!userId) {
      this.errorMessage.set('No authenticated user found. Please sign in again.');
      return;
    }

    this.loading.set(true);
    this.roadmapApi.getPublishedCareerPaths().subscribe({
      next: (paths) => {
        this.careerPaths = this.mapCareerPaths(paths);
        if (!this.careerPath() && this.careerPaths.length > 0) {
          this.careerPath.set(this.careerPaths[0].value);
        }
        this.loadSessions(userId);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Could not load interview configuration from backend.');
      },
    });
  }

  openModal(mode: 'practice' | 'test'): void {
    this.selectedMode.set(mode);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  setQuestionType(t: QuestionType): void {
    this.questionType.set(t);
  }

  setDifficulty(d: Difficulty): void {
    this.difficulty.set(d);
  }

  setQuestionCount(n: number): void {
    this.questionCount.set(n);
  }

  toggleVideo(): void {
    this.videoEnabled.update((v) => !v);
  }

  beginSession(): void {
    const userId = this.userId();
    if (!userId) {
      this.errorMessage.set('No authenticated user found. Please sign in again.');
      return;
    }

    const selectedCareerPath = this.selectedCareerPath();
    if (!selectedCareerPath?.label) {
      this.errorMessage.set('Please select a career path before starting.');
      return;
    }

    this.creatingSession.set(true);
    this.errorMessage.set(null);

    this.roadmapApi
      .createInterviewSession(userId, selectedCareerPath.label, this.difficulty().toUpperCase())
      .subscribe({
        next: (session) => {
          this.creatingSession.set(false);
          this.showModal.set(false);
          void this.router.navigate(['/dashboard/interview/session', session.id], {
            queryParams: { mode: this.selectedMode() },
          });
        },
        error: () => {
          this.creatingSession.set(false);
          this.errorMessage.set('Unable to create interview session right now. Please try again.');
        },
      });
  }

  getScoreBorder(score: number): string {
    if (score >= 8) {
      return 'border-green';
    }
    if (score < 6) {
      return 'border-orange';
    }
    return '';
  }

  private loadSessions(userId: number): void {
    this.roadmapApi.getInterviewSessions(userId).subscribe({
      next: (items) => {
        const sorted = [...items].sort((a, b) => {
          const left = a.startedAt ? new Date(a.startedAt).getTime() : 0;
          const right = b.startedAt ? new Date(b.startedAt).getTime() : 0;
          return right - left;
        });

        this.sessions = sorted.map((item) => this.mapSession(item));
        this.recomputeStats(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Could not load interview session history from backend.');
      },
    });
  }

  private mapSession(session: InterviewSessionDto): SessionHistory {
    const completed = (session.status || '').toUpperCase() === 'COMPLETED';
    const started = session.startedAt ? new Date(session.startedAt) : new Date();

    return {
      id: `sess-${session.id}`,
      mode: completed ? 'test' : 'practice',
      questionType: session.difficulty || 'Interview',
      careerPath: session.careerPath || 'Career Path',
      date: started.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      score: typeof session.finalScore === 'number' ? session.finalScore : 0,
    };
  }

  private recomputeStats(items: InterviewSessionDto[]): void {
    const completed = items.filter((s) => (s.status || '').toUpperCase() === 'COMPLETED');
    const monthNow = new Date().getMonth();
    const yearNow = new Date().getFullYear();

    this.sessionsThisMonth = completed.filter((session) => {
      if (!session.startedAt) {
        return false;
      }
      const d = new Date(session.startedAt);
      return d.getMonth() === monthNow && d.getFullYear() === yearNow;
    }).length;

    const scored = completed
      .map((session) => session.finalScore)
      .filter((score): score is number => typeof score === 'number');

    this.avgScore = scored.length
      ? Number((scored.reduce((sum, value) => sum + value, 0) / scored.length).toFixed(1))
      : 0;

    const latest = completed.find((session) => !!session.startedAt);
    this.lastSession = latest?.startedAt ? this.relativeDate(new Date(latest.startedAt)) : 'N/A';

    const streak = this.calculateCurrentStreak(completed);
    this.streak = streak;
    this.bestStreak = Math.max(this.bestStreak, streak);

    if (scored.length >= 2) {
      const delta = scored[0] - scored[1];
      this.scoreTrend = delta.toFixed(1);
    } else {
      this.scoreTrend = '0.0';
    }
  }

  private calculateCurrentStreak(items: InterviewSessionDto[]): number {
    const completedDays = new Set(
      items
        .filter((item) => !!item.startedAt)
        .map((item) => new Date(item.startedAt!).toISOString().slice(0, 10))
    );

    const cursor = new Date();
    let streak = 0;

    while (true) {
      const currentDay = cursor.toISOString().slice(0, 10);
      if (!completedDays.has(currentDay)) {
        break;
      }
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  private relativeDate(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      return 'today';
    }
    if (days === 1) {
      return '1 day ago';
    }
    return `${days} days ago`;
  }

  private mapCareerPaths(paths: CareerPathOptionDto[]): { value: string; label: string; emoji: string }[] {
    return (paths || []).map((path) => {
      const title = path.title || 'Career Path';
      return {
        value: title,
        label: title,
        emoji: this.resolveCareerPathEmoji(title),
      };
    });
  }

  private resolveCareerPathEmoji(title: string): string {
    const normalized = title.toLowerCase();
    if (normalized.includes('front')) {
      return '🎨';
    }
    if (normalized.includes('back')) {
      return '⚙️';
    }
    if (normalized.includes('full')) {
      return '🔗';
    }
    if (normalized.includes('mobile')) {
      return '📱';
    }
    if (normalized.includes('data')) {
      return '📊';
    }
    if (normalized.includes('devops')) {
      return '🚀';
    }
    return '🎯';
  }
}
