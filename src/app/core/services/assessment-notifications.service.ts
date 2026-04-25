import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AssessmentAdminApiService } from '../../features/back-office/service/assessment-admin-api.service';
import { CandidateAssignmentApiService } from '../../features/front-office/assessments/candidate-assignment-api.service';
import type { CandidateAssignmentStatusDto } from '../../features/front-office/assessments/candidate-assignment-api.service';
import {
  CandidateSessionApiService,
  isSessionCompleted,
  isSessionPublished,
  SessionResponseDto,
} from '../../features/front-office/assessments/candidate-session-api.service';
import { collectCandidateUserIdsForSessions } from '../../features/front-office/assessments/assessment-canonical-user';
import { getAssessmentUserId } from '../../features/front-office/profile/profile-user-id';
import { AssessmentAlertToastService } from './assessment-alert-toast.service';

export interface AssessmentNotifItem {
  id: string;
  text: string;
  time: string;
  color: string;
  route?: (string | number)[];
  queryParams?: Record<string, string | number | boolean>;
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'Recently';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'Recently';
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d ago`;
  return new Date(iso).toLocaleDateString();
}

function sessionInProgress(s: SessionResponseDto): boolean {
  return String(s.status ?? '')
    .trim()
    .toUpperCase()
    .replace(/-/g, '_') === 'IN_PROGRESS';
}

function categoryAction(
  categoryId: number,
  history: SessionResponseDto[]
): { kind: 'start' | 'continue' | 'completed'; session?: SessionResponseDto } {
  const cid = Number(categoryId);
  const list = history.filter((s) => Number(s.categoryId) === cid);
  const completed = list.find((s) => isSessionCompleted(s));
  if (completed) return { kind: 'completed', session: completed };
  const inProg = list.find((s) => sessionInProgress(s));
  if (inProg) return { kind: 'continue', session: inProg };
  return { kind: 'start' };
}

@Injectable({ providedIn: 'root' })
export class AssessmentNotificationsService {
  private readonly adminApi = inject(AssessmentAdminApiService);
  private readonly assignmentApi = inject(CandidateAssignmentApiService);
  private readonly sessionApi = inject(CandidateSessionApiService);
  private readonly toast = inject(AssessmentAlertToastService);

  private readonly adminItemsSig = signal<AssessmentNotifItem[]>([]);
  private readonly candidateItemsSig = signal<AssessmentNotifItem[]>([]);

  private adminWarmed = false;
  private prevAdminPending = 0;
  private prevAdminRelease = 0;

  private candWarmed = false;
  private prevAwaitingPublish = 0;
  private prevReadyToStart = 0;
  private prevInProgId: number | null = null;
  private prevPlanStatus: string | null = null;

  readonly adminItems = this.adminItemsSig.asReadonly();
  readonly candidateItems = this.candidateItemsSig.asReadonly();

  readonly adminCount = computed(() => this.adminItemsSig().length);
  readonly candidateCount = computed(() => this.candidateItemsSig().length);

  constructor() {
    if (typeof document === 'undefined') {
      return;
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        queueMicrotask(() => {
          this.refreshAdmin();
          this.refreshCandidate();
        });
      }
    });
  }

  refreshAdmin(): void {
    forkJoin({
      pending: this.adminApi.listPendingAssignments().pipe(catchError(() => of([]))),
      release: this.adminApi.listSessionsPendingRelease().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ pending, release }) => {
        const pCount = pending.length;
        const rCount = release.length;

        if (this.adminWarmed) {
          if (pCount > this.prevAdminPending) {
            const d = pCount - this.prevAdminPending;
            this.toast.show({
              title: 'Skill assessments',
              message:
                d === 1
                  ? 'A new candidate is waiting for category assignment.'
                  : `${d} new candidate(s) need category assignment (${pCount} total in queue).`,
              variant: 'warning',
            });
          }
          if (rCount > this.prevAdminRelease) {
            const d = rCount - this.prevAdminRelease;
            this.toast.show({
              title: 'Skill assessments',
              message:
                d === 1
                  ? 'A completed attempt is ready to publish to the candidate.'
                  : `${d} new result(s) are ready to publish (${rCount} total).`,
              variant: 'info',
            });
          }
        }

        this.prevAdminPending = pCount;
        this.prevAdminRelease = rCount;
        this.adminWarmed = true;

        const items: AssessmentNotifItem[] = [];
        if (pCount > 0) {
          items.push({
            id: 'admin-assignments',
            text:
              pCount === 1
                ? '1 candidate is waiting for category assignment.'
                : `${pCount} candidates are waiting for category assignment.`,
            time: relativeTime(pending[0]?.createdAt),
            color: '#f59e0b',
            route: ['/admin/skill-assessments'],
          });
        }
        if (rCount > 0) {
          items.push({
            id: 'admin-publish',
            text:
              rCount === 1
                ? '1 assessment result is ready to publish to the candidate.'
                : `${rCount} assessment results are ready to publish.`,
            time: relativeTime(release[0]?.completedAt ?? release[0]?.startedAt),
            color: '#6366f1',
            route: ['/admin/skill-assessments'],
          });
        }
        this.adminItemsSig.set(items);
      },
      error: () => this.adminItemsSig.set([]),
    });
  }

  refreshCandidate(): void {
    const baseUid = getAssessmentUserId();
    if (!baseUid) {
      this.candidateItemsSig.set([]);
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
            catchError(() => of([] as SessionResponseDto[])),
            map((history) => ({ plan, history }))
          );
        }),
        catchError(() => of({ plan: null as CandidateAssignmentStatusDto | null, history: [] as SessionResponseDto[] }))
      )
      .subscribe({
        next: ({ plan, history }) => {
          let readyToStart = 0;
          if (plan?.status === 'APPROVED' && plan.assignedCategories?.length) {
            for (const c of plan.assignedCategories) {
              if (categoryAction(c.id, history).kind === 'start') {
                readyToStart++;
              }
            }
          }

          const inProg = history.find((s) => sessionInProgress(s)) ?? null;
          const awaitingPublish = history.filter(
            (s) => isSessionCompleted(s) && !isSessionPublished(s)
          );
          const awaitCount = awaitingPublish.length;
          const planStatus = plan?.status ?? 'NONE';

          if (this.candWarmed) {
            const becameApproved =
              this.prevPlanStatus !== 'APPROVED' && planStatus === 'APPROVED';

            if (becameApproved) {
              this.toast.show({
                title: 'Skill assessments',
                message: 'Your plan was approved — you can start your assigned assessments.',
                variant: 'success',
              });
            } else if (
              this.prevPlanStatus !== 'PENDING' &&
              planStatus === 'PENDING'
            ) {
              this.toast.show({
                title: 'Skill assessments',
                message: 'Your assessment preferences were received — waiting for administrator approval.',
                variant: 'info',
              });
            }

            if (awaitCount > this.prevAwaitingPublish) {
              const d = awaitCount - this.prevAwaitingPublish;
              this.toast.show({
                title: 'Skill assessments',
                message:
                  d === 1
                    ? 'You submitted an assessment — results will appear after an administrator publishes them.'
                    : `${d} new submission(s) are waiting for publication (${awaitCount} total).`,
                variant: 'info',
              });
            }

            if (!becameApproved && readyToStart > this.prevReadyToStart) {
              const d = readyToStart - this.prevReadyToStart;
              this.toast.show({
                title: 'Skill assessments',
                message:
                  d === 1
                    ? 'You have a new assessment available to start.'
                    : `${d} new assessment(s) are available to start.`,
                variant: 'success',
              });
            }

            const ipId = inProg?.id ?? null;
            if (this.prevInProgId == null && ipId != null) {
              this.toast.show({
                title: 'Skill assessments',
                message: `In progress: ${inProg!.categoryTitle} — finish and submit when ready.`,
                variant: 'info',
              });
            }
          }

          this.prevAwaitingPublish = awaitCount;
          this.prevReadyToStart = readyToStart;
          this.prevInProgId = inProg?.id ?? null;
          this.prevPlanStatus = planStatus;
          this.candWarmed = true;

          const items: AssessmentNotifItem[] = [];

          if (plan?.status === 'PENDING') {
            items.push({
              id: 'cand-plan-pending',
              text: 'Your skill assessment plan is awaiting administrator approval.',
              time: relativeTime(plan.createdAt),
              color: '#f59e0b',
              route: ['/dashboard/assessments'],
            });
          }

          if (plan?.status === 'APPROVED' && plan.assignedCategories?.length) {
            if (readyToStart > 0) {
              items.push({
                id: 'cand-ready-start',
                text:
                  readyToStart === 1
                    ? 'You have an assessment ready to start.'
                    : `You have ${readyToStart} assessments ready to start.`,
                time: relativeTime(plan.approvedAt ?? plan.createdAt),
                color: '#2ee8a5',
                route: ['/dashboard/assessments'],
              });
            }
          }

          if (inProg) {
            items.push({
              id: `cand-inprog-${inProg.id}`,
              text: `Continue your in-progress assessment: ${inProg.categoryTitle}.`,
              time: relativeTime(inProg.startedAt),
              color: '#3b82f6',
              route: ['/dashboard/assessments/session', inProg.id],
            });
          }

          if (awaitCount > 0) {
            items.push({
              id: 'cand-awaiting-publish',
              text:
                awaitCount === 1
                  ? 'One submitted result is awaiting publication by an administrator.'
                  : `${awaitCount} submitted results are awaiting administrator publication.`,
              time: relativeTime(
                awaitingPublish[0]?.completedAt ?? awaitingPublish[0]?.startedAt
              ),
              color: '#a78bfa',
              route: ['/dashboard/assessments'],
            });
          }

          this.candidateItemsSig.set(items);
        },
        error: () => this.candidateItemsSig.set([]),
      });
  }
}
