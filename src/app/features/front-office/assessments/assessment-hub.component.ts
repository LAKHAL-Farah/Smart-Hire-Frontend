import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, switchMap, filter } from 'rxjs/operators';
import { LUCIDE_ICONS } from '../../../shared/lucide-icons';
import {
  CandidateAssignmentApiService,
  CandidateAssignmentStatusDto,
} from './candidate-assignment-api.service';
import {
  CandidateSessionApiService,
  SessionResponseDto,
  isSessionCompleted,
  isSessionPublished,
} from './candidate-session-api.service';
import { collectCandidateUserIdsForSessions } from './assessment-canonical-user';
import { getAssessmentUserId } from '../profile/profile-user-id';
import { SearchService } from '../../../core/services/search.service';

interface PendingStart {
  categoryId: number;
  title: string;
  code: string;
}

type CategoryActionKind = 'start' | 'completed';

interface CategoryAction {
  kind: CategoryActionKind;
  session?: SessionResponseDto;
}

@Component({
  selector: 'app-assessment-hub',
  standalone: true,
  imports: [CommonModule, RouterLink, LUCIDE_ICONS],
  templateUrl: './assessment-hub.component.html',
  styleUrl: './assessment-hub.component.scss',
})
export class AssessmentHubComponent implements OnInit, OnDestroy {
  private readonly assignmentApi = inject(CandidateAssignmentApiService);
  private readonly sessionApi = inject(CandidateSessionApiService);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);

  loading = signal(false);
  errorMsg = signal<string | null>(null);
  plan = signal<CandidateAssignmentStatusDto | null>(null);
  noPlan = signal(false);
  sessions = signal<SessionResponseDto[]>([]);

  startingCategoryId = signal<number | null>(null);
  startConfirmOpen = signal(false);
  pendingStart = signal<PendingStart | null>(null);

  /** Search query for filtering assigned categories */
  // driven by topbar SearchService — no local signal needed

  /** Sessions that are completed (used for history section). */
  history = computed(() =>
    this.sessions().filter((s) => isSessionCompleted(s))
  );

  /** Assigned categories filtered by topbar search query */
  filteredCategories = computed(() => {
    const plan = this.plan();
    if (!plan || plan.status !== 'APPROVED') return [];
    const q = this.searchService.query().trim().toLowerCase();
    if (!q) return plan.assignedCategories;
    return plan.assignedCategories.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.refresh();
    // Poll every 30s so the page updates when admin approves
    this.pollTimer = setInterval(() => this.refresh(), 30_000);
    
    // Also refresh when user navigates back to this page (e.g., after forfeit or integrity violation)
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        filter((event: any) => event.urlAfterRedirects.includes('/dashboard/assessments') && !event.urlAfterRedirects.includes('/session'))
      )
      .subscribe(() => {
        this.refresh();
      });
  }

  ngOnDestroy(): void {
    if (this.pollTimer != null) {
      clearInterval(this.pollTimer);
    }
  }

  refresh(): void {
    const uid = getAssessmentUserId();
    if (!uid) {
      this.errorMsg.set('Sign in to view your assessments.');
      return;
    }
    this.loading.set(true);
    this.errorMsg.set(null);

    this.assignmentApi
      .getStatus(uid)
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            this.noPlan.set(true);
            return of(null);
          }
          this.errorMsg.set(this.formatErr(err));
          return of(null);
        }),
        switchMap((p) => {
          this.plan.set(p);
          const ids = collectCandidateUserIdsForSessions(p, uid);
          return this.sessionApi
            .listForUserMergedDistinct(ids)
            .pipe(catchError(() => of([] as SessionResponseDto[])));
        })
      )
      .subscribe({
        next: (rows) => {
          this.sessions.set(rows);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.errorMsg.set(this.formatErr(err));
        },
      });
  }

  /**
   * Determines what action is available for a given category tile.
   * - 'completed': user has any session for this category (completed, integrity violation, or forfeit)
   * - 'start': no session yet
   * Note: We no longer show 'continue' since users get only one attempt per category
   */
  categoryAction(categoryId: number): CategoryAction {
    const match = this.sessions().find((s) => s.categoryId === categoryId);
    if (!match) {
      return { kind: 'start' };
    }
    // Any existing session means the category is completed (no more attempts allowed)
    return { kind: 'completed', session: match };
  }

  sessionIsCompleted(s: SessionResponseDto): boolean {
    return isSessionCompleted(s);
  }

  sessionIsPublished(s: SessionResponseDto): boolean {
    return isSessionPublished(s);
  }

  openStartConfirm(categoryId: number, title: string, code: string): void {
    this.pendingStart.set({ categoryId, title, code });
    this.startConfirmOpen.set(true);
  }

  dismissStartConfirm(): void {
    this.startConfirmOpen.set(false);
    this.pendingStart.set(null);
  }

  confirmStartAssessment(): void {
    const ps = this.pendingStart();
    if (!ps) return;
    this.dismissStartConfirm();
    this.startSession(ps.categoryId);
  }

  private startSession(categoryId: number): void {
    const uid = getAssessmentUserId();
    if (!uid) {
      this.errorMsg.set('Sign in to start an assessment.');
      return;
    }
    this.startingCategoryId.set(categoryId);
    this.errorMsg.set(null);

    // Resolve display name from plan userId if available
    const displayName: string | null = null;

    this.sessionApi.startSession(uid, categoryId, displayName).subscribe({
      next: (session) => {
        this.startingCategoryId.set(null);
        this.router.navigate(['/dashboard/assessments/session', session.id]);
      },
      error: (err: unknown) => {
        this.startingCategoryId.set(null);
        this.errorMsg.set(this.formatErr(err));
      },
    });
  }

  private formatErr(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const b = err.error;
      if (b && typeof b === 'object' && 'message' in b) {
        return String((b as { message: unknown }).message);
      }
      if (typeof b === 'string' && b.trim()) return b;
      if (err.status === 0) return 'Cannot reach MS-Assessment. Is the service running?';
      return `Error ${err.status}`;
    }
    return 'Something went wrong.';
  }
}
