import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { InterviewApiService } from '../interview-api.service';
import { InterviewReportDto, InterviewSessionDto, InterviewStreakDto, SessionStatus } from '../interview.models';
import { resolveCurrentUserId } from '../interview-user.util';

@Component({
  selector: 'app-interview-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interview-history.component.html',
  styleUrl: './interview-history.component.scss',
})
export class InterviewHistoryComponent implements OnInit {
  private readonly api = inject(InterviewApiService);
  private readonly router = inject(Router);
  private readonly dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  readonly userId = signal<number | null>(resolveCurrentUserId());
  readonly userInput = signal(resolveCurrentUserId() ? String(resolveCurrentUserId()) : '');
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly sessions = signal<InterviewSessionDto[]>([]);
  readonly reports = signal<InterviewReportDto[]>([]);
  readonly leaderboard = signal<InterviewStreakDto[]>([]);

  readonly search = signal('');
  readonly roleFilter = signal<'ALL' | 'SE' | 'CLOUD' | 'AI'>('ALL');
  readonly modeFilter = signal<'ALL' | 'PRACTICE' | 'TEST'>('ALL');
  readonly statusFilter = signal<'ALL' | SessionStatus>('ALL');
  readonly userInputError = computed(() => this.validateUserInput(this.userInput()));
  readonly isUserInputValid = computed(() => this.userInputError() === null);

  readonly reportBySession = computed(() => {
    const map = new Map<number, InterviewReportDto>();
    for (const report of this.reports()) {
      map.set(report.sessionId, report);
    }
    return map;
  });

  readonly sortedSessions = computed(() =>
    [...this.sessions()].sort(
      (a, b) => new Date(b.startedAt ?? 0).getTime() - new Date(a.startedAt ?? 0).getTime()
    )
  );

  readonly filteredSessions = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.sortedSessions().filter((session) => {
      if (this.roleFilter() !== 'ALL' && session.roleType !== this.roleFilter()) {
        return false;
      }
      if (this.modeFilter() !== 'ALL' && session.mode !== this.modeFilter()) {
        return false;
      }
      if (this.statusFilter() !== 'ALL' && session.status !== this.statusFilter()) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        session.roleType,
        session.mode,
        session.status,
        session.type,
        this.formatDate(session.startedAt),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  });

  readonly completedSessions = computed(() =>
    this.sessions().filter((session) => session.status === 'COMPLETED')
  );

  readonly avgCompletedScore = computed(() => {
    const scored = this.completedSessions().filter((session) => typeof session.totalScore === 'number');
    if (!scored.length) {
      return null;
    }

    const total = scored.reduce((sum, session) => sum + (session.totalScore ?? 0), 0);
    return total / scored.length;
  });

  readonly bestScore = computed(() => {
    const scored = this.completedSessions().map((session) => session.totalScore ?? 0);
    return scored.length ? Math.max(...scored) : null;
  });

  readonly completionRate = computed(() => {
    const total = this.sessions().length;
    if (!total) {
      return 0;
    }

    return (this.completedSessions().length / total) * 100;
  });

  readonly thisMonthCount = computed(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return this.sessions().filter((session) => {
      if (!session.startedAt) {
        return false;
      }
      const date = new Date(session.startedAt);
      return date.getMonth() === month && date.getFullYear() === year;
    }).length;
  });

  readonly currentUserLeaderboardRank = computed(() =>
    this.leaderboard().findIndex((row) => row.userId === this.userId()) + 1
  );

  ngOnInit(): void {
    if (this.isUserInputValid()) {
      this.loadHistory();
      return;
    }

    this.loading.set(false);
    this.loadError.set('Enter a valid user id to load interview history.');
  }

  setUserInput(value: string | number | null): void {
    const normalized = String(value ?? '');
    this.userInput.set(normalized.replace(/[^\d]/g, '').slice(0, 10));
  }

  loadHistory(): void {
    const validation = this.validateUserInput(this.userInput());
    if (validation) {
      this.loading.set(false);
      this.loadError.set(validation);
      return;
    }

    const userId = Number(this.userInput());

    this.userId.set(userId);
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      sessions: this.api.getSessionsByUser(userId).pipe(catchError(() => of([]))),
      reports: this.api.getReportsByUser(userId).pipe(catchError(() => of([]))),
      leaderboard: this.api.getLeaderboard(8).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ sessions, reports, leaderboard }) => {
        this.sessions.set(sessions);
        this.reports.set(reports);
        this.leaderboard.set(leaderboard);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load interview history.');
        this.loading.set(false);
      },
    });
  }

  openReport(reportId: number | null): void {
    if (!reportId) {
      return;
    }

    this.router.navigate(['/dashboard/interview/report', reportId]);
  }

  openSession(sessionId: number): void {
    this.router.navigate(['/dashboard/interview/session', sessionId]);
  }

  clearFilters(): void {
    this.search.set('');
    this.roleFilter.set('ALL');
    this.modeFilter.set('ALL');
    this.statusFilter.set('ALL');
  }

  getDisplayScore(session: InterviewSessionDto): string {
    return session.totalScore === null ? '—' : `${session.totalScore.toFixed(1)} / 10`;
  }

  getSessionDurationLabel(session: InterviewSessionDto): string {
    const seconds = session.durationSeconds;
    if (!seconds || seconds < 0) {
      return '—';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  }

  getReportId(session: InterviewSessionDto): number | null {
    return session.report?.id ?? this.reportBySession().get(session.id)?.id ?? null;
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '—';
    }
    return this.dateFormatter.format(new Date(value));
  }

  getStatusClass(status: SessionStatus): string {
    switch (status) {
      case 'COMPLETED':
        return 'status-completed';
      case 'IN_PROGRESS':
        return 'status-progress';
      case 'PAUSED':
        return 'status-paused';
      case 'ABANDONED':
        return 'status-abandoned';
      default:
        return 'status-evaluating';
    }
  }

  getLeaderboardMedal(index: number): string {
    if (index === 0) {
      return '🥇';
    }
    if (index === 1) {
      return '🥈';
    }
    if (index === 2) {
      return '🥉';
    }
    return `#${index + 1}`;
  }

  backToHub(): void {
    this.router.navigate(['/dashboard/interview']);
  }

  private validateUserInput(value: string): string | null {
    const raw = value.trim();
    if (!raw) {
      return 'User id is required.';
    }

    if (!/^\d+$/.test(raw)) {
      return 'User id must contain digits only.';
    }

    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 2147483647) {
      return 'User id must be a positive integer.';
    }

    return null;
  }
}
