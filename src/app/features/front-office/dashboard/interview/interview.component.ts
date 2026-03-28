import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';
import { InterviewApiService } from './interview-api.service';
import { InterviewSessionDto, InterviewStreakDto, SessionStatus } from './interview.models';
import { resolveCurrentUserId } from './interview-user.util';

interface PastSessionRow {
  id: number;
  roleLabel: string;
  modeLabel: string;
  modeClass: 'mode-practice' | 'mode-test';
  scoreLabel: string;
  dateLabel: string;
  status: SessionStatus;
  reportId: number | null;
}

@Component({
  selector: 'app-interview',
  standalone: true,
  imports: [CommonModule, LUCIDE_ICONS],
  templateUrl: './interview.component.html',
  styleUrl: './interview.component.scss'
})
export class InterviewComponent implements OnInit {
  private readonly interviewApi = inject(InterviewApiService);
  private readonly router = inject(Router);

  private readonly shortDateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  });

  readonly userId = resolveCurrentUserId();
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly streak = signal<InterviewStreakDto | null>(null);
  readonly sessions = signal<InterviewSessionDto[]>([]);
  readonly activeSession = signal<InterviewSessionDto | null>(null);

  readonly completedSessions = computed(() =>
    [...this.sessions()]
      .filter((session) => session.status === 'COMPLETED')
      .sort((a, b) => this.dateValue(b.startedAt) - this.dateValue(a.startedAt))
  );

  readonly averageScoreLastTen = computed(() => {
    const scored = this.completedSessions()
      .filter((session) => session.totalScore !== null)
      .slice(0, 10);

    if (!scored.length) {
      return null;
    }

    const total = scored.reduce((sum, session) => sum + (session.totalScore ?? 0), 0);
    return total / scored.length;
  });

  readonly pastSessionRows = computed<PastSessionRow[]>(() =>
    this.completedSessions()
      .slice(0, 5)
      .map((session) => ({
        id: session.id,
        roleLabel: this.getRoleLabel(session),
        modeLabel: session.mode,
        modeClass: session.mode === 'PRACTICE' ? 'mode-practice' : 'mode-test',
        scoreLabel: session.totalScore === null ? '—' : session.totalScore.toFixed(1),
        dateLabel: this.formatShortDate(session.startedAt),
        status: session.status,
        reportId: session.report?.id ?? null,
      }))
  );

  ngOnInit(): void {
    this.loadHubData();
  }

  goToSetup(mode?: 'PRACTICE' | 'TEST'): void {
    this.router.navigate(['/dashboard/interview/setup'], {
      queryParams: mode ? { mode } : undefined,
    });
  }

  resumeActiveSession(): void {
    const active = this.activeSession();
    if (!active) {
      return;
    }

    this.router.navigate(['/dashboard/interview/session', active.id]);
  }

  openHistory(): void {
    this.router.navigate(['/dashboard/interview/history']);
  }

  openBookmarks(): void {
    this.router.navigate(['/dashboard/interview/bookmarks']);
  }

  openDiscover(): void {
    this.router.navigate(['/dashboard/interview/discover']);
  }

  openReport(reportId: number | null): void {
    if (!reportId) {
      return;
    }

    this.router.navigate(['/dashboard/interview/report', reportId]);
  }

  getStatusClass(status: SessionStatus): string {
    switch (status) {
      case 'COMPLETED':
        return 'status-completed';
      case 'PAUSED':
        return 'status-paused';
      case 'IN_PROGRESS':
        return 'status-active';
      case 'ABANDONED':
        return 'status-abandoned';
      default:
        return 'status-evaluating';
    }
  }

  get currentStreak(): number {
    return this.streak()?.currentStreak ?? 0;
  }

  get longestStreak(): number {
    return this.streak()?.longestStreak ?? 0;
  }

  get totalSessionsCompleted(): number {
    return this.streak()?.totalSessionsCompleted ?? 0;
  }

  private loadHubData(): void {
    const userId = this.userId;
    if (!userId) {
      this.isLoading.set(false);
      this.loadError.set('No active user found. Please sign in again to load your interview data.');
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);

    forkJoin({
      streak: this.interviewApi.getStreak(userId).pipe(catchError(() => of(null))),
      sessions: this.interviewApi.getSessionsByUser(userId).pipe(catchError(() => of([]))),
      activeSession: this.interviewApi.getActiveSession(userId).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ streak, sessions, activeSession }) => {
        this.streak.set(streak);
        this.sessions.set(sessions);
        this.activeSession.set(activeSession);

        if (!streak) {
          this.loadError.set('Some interview data could not be loaded.');
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Failed to load interview data.');
        this.isLoading.set(false);
      },
    });
  }

  private getRoleLabel(session: InterviewSessionDto): string {
    switch (session.roleType) {
      case 'SE':
        return 'SE';
      case 'CLOUD':
        return 'CLOUD';
      case 'AI':
        return 'AI';
      default:
        return session.roleType;
    }
  }

  private formatShortDate(value: string | null): string {
    if (!value) {
      return '—';
    }

    return this.shortDateFormatter.format(new Date(value));
  }

  private dateValue(value: string | null): number {
    if (!value) {
      return 0;
    }

    return new Date(value).getTime();
  }
}
