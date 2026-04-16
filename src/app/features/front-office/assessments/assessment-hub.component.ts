import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { LUCIDE_ICONS } from '../../../shared/lucide-icons';
import { getAssessmentUserId } from '../profile/profile-user-id';
import { ProfileApiService, ProfileApiResponse } from '../profile/profile-api.service';
import { canonicalSessionListUserId, collectCandidateUserIdsForSessions } from './assessment-canonical-user';
import {
  CandidateAssignmentApiService,
  CandidateAssignmentStatusDto,
} from './candidate-assignment-api.service';
import {
  CandidateSessionApiService,
  isSessionPublished,
  SessionResponseDto,
} from './candidate-session-api.service';
import { AssessmentNotificationsService } from '../../../core/services/assessment-notifications.service';

@Component({
  selector: 'app-assessment-hub',
  standalone: true,
  imports: [CommonModule, RouterLink, LUCIDE_ICONS],
  templateUrl: './assessment-hub.component.html',
  styleUrl: './assessment-hub.component.scss',
})
export class AssessmentHubComponent implements OnInit {
  private readonly assignmentApi = inject(CandidateAssignmentApiService);
  private readonly sessionApi = inject(CandidateSessionApiService);
  private readonly profileApi = inject(ProfileApiService);
  private readonly router = inject(Router);
  private readonly assessmentNotif = inject(AssessmentNotificationsService);

  loading = signal(true);
  errorMsg = signal<string | null>(null);

  /** No row in MS-Assessment — legacy accounts can still start sessions if backend allows. */
  noPlan = signal(false);

  plan = signal<CandidateAssignmentStatusDto | null>(null);
  history = signal<SessionResponseDto[]>([]);

  startingCategoryId = signal<number | null>(null);

  /** Before first start: rules about proctoring & quitting */
  startConfirmOpen = signal(false);
  pendingStart = signal<{ id: number; title: string; code: string } | null>(null);

  ngOnInit(): void {
    const baseUid = getAssessmentUserId();
    if (!baseUid) {
      this.loading.set(false);
      this.errorMsg.set('Sign in to see your assessments.');
      return;
    }

    this.assignmentApi
      .getStatus(baseUid)
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            return of(null as CandidateAssignmentStatusDto | null);
          }
          return throwError(() => err);
        }),
        switchMap((plan) => {
          const ids = collectCandidateUserIdsForSessions(plan, baseUid);
          return this.sessionApi.listForUserMergedDistinct(ids).pipe(
            catchError(() => {
              this.errorMsg.set(
                'Could not load your attempts from the assessment server. Check MS-Assessment (port 8084) and refresh.'
              );
              return of([] as SessionResponseDto[]);
            }),
            map((history) => ({ plan, history }))
          );
        })
      )
      .subscribe({
        next: ({ plan, history }) => {
          if (plan === null) {
            this.noPlan.set(true);
            this.plan.set(null);
          } else {
            this.noPlan.set(false);
            this.plan.set(plan);
          }
          this.history.set(history);
          this.loading.set(false);
          this.assessmentNotif.refreshCandidate();
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.errorMsg.set(this.formatErr(err));
        },
      });
  }

  refresh(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.ngOnInit();
  }

  /**
   * One completed attempt per category blocks a new Start; an in-progress session shows Continue instead.
   */
  categoryAction(categoryId: number): {
    kind: 'start' | 'continue' | 'completed';
    session?: SessionResponseDto;
  } {
    const cid = Number(categoryId);
    const list = this.history().filter((s) => Number(s.categoryId) === cid);
    const completed = list.find((s) => this.sessionCompleted(s));
    if (completed) {
      return { kind: 'completed', session: completed };
    }
    const inProg = list.find((s) => this.sessionInProgress(s));
    if (inProg) {
      return { kind: 'continue', session: inProg };
    }
    return { kind: 'start' };
  }

  continueSession(sessionId: number): void {
    void this.router.navigate(['/dashboard/assessments/session', sessionId]);
  }

  openStartConfirm(categoryId: number, title: string, code: string): void {
    if (this.startingCategoryId() != null) {
      return;
    }
    this.pendingStart.set({ id: categoryId, title, code });
    this.startConfirmOpen.set(true);
  }

  dismissStartConfirm(): void {
    this.startConfirmOpen.set(false);
    this.pendingStart.set(null);
  }

  confirmStartAssessment(): void {
    const p = this.pendingStart();
    if (!p) {
      return;
    }
    this.startConfirmOpen.set(false);
    this.pendingStart.set(null);
    this.startCategory(p.id);
  }

  startCategory(categoryId: number): void {
    const baseUid = getAssessmentUserId();
    if (!baseUid) return;
    const uid = canonicalSessionListUserId(this.plan(), baseUid);
    this.startingCategoryId.set(categoryId);
    this.profileApi
      .getProfile(uid)
      .pipe(
        catchError(() => of(null as ProfileApiResponse | null)),
        switchMap((p) => {
          const name = p ? this.displayNameFromProfile(p) : undefined;
          return this.sessionApi.startSession(uid, categoryId, name);
        })
      )
      .subscribe({
        next: (s) => {
          this.startingCategoryId.set(null);
          void this.router.navigate(['/dashboard/assessments/session', s.id]);
        },
        error: (err: unknown) => {
          this.startingCategoryId.set(null);
          this.errorMsg.set(this.formatErr(err));
        },
      });
  }

  private displayNameFromProfile(p: ProfileApiResponse): string | undefined {
    const fn = (p.firstName ?? '').trim();
    const ln = (p.lastName ?? '').trim();
    const full = `${fn} ${ln}`.trim();
    if (full) return full;
    const em = p.email?.trim();
    return em || undefined;
  }

  private sessionCompleted(s: SessionResponseDto): boolean {
    return String(s.status ?? '')
      .trim()
      .toUpperCase()
      .replace(/-/g, '_') === 'COMPLETED';
  }

  private sessionInProgress(s: SessionResponseDto): boolean {
    return String(s.status ?? '')
      .trim()
      .toUpperCase()
      .replace(/-/g, '_') === 'IN_PROGRESS';
  }

  /** Session row is completed (submitted); status stays COMPLETED after admin publish. */
  sessionIsCompleted(s: SessionResponseDto): boolean {
    return this.sessionCompleted(s);
  }

  /** Results/score/feedback visible only after admin publish. */
  sessionIsPublished(s: SessionResponseDto): boolean {
    return isSessionPublished(s);
  }

  private formatErr(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const b = err.error;
      if (typeof b === 'string' && b.trim()) return b;
      if (b && typeof b === 'object' && 'message' in b) {
        return String((b as { message: unknown }).message);
      }
      if (err.status === 403) {
        return 'You already have an attempt for this category (one attempt per category; no retake after submit). Refresh to continue an in-progress attempt or view published results.';
      }
      return err.message || `Error ${err.status}`;
    }
    return 'Something went wrong.';
  }
}
