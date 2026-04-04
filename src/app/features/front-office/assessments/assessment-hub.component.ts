import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LUCIDE_ICONS } from '../../../shared/lucide-icons';
import { getProfileUserUuid } from '../profile/profile-user-id';
import {
  CandidateAssignmentApiService,
  CandidateAssignmentStatusDto,
} from './candidate-assignment-api.service';
import {
  CandidateSessionApiService,
  SessionResponseDto,
} from './candidate-session-api.service';

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
  private readonly router = inject(Router);

  loading = signal(true);
  errorMsg = signal<string | null>(null);

  /** No row in MS-Assessment — legacy accounts can still start sessions if backend allows. */
  noPlan = signal(false);

  plan = signal<CandidateAssignmentStatusDto | null>(null);
  history = signal<SessionResponseDto[]>([]);

  startingCategoryId = signal<number | null>(null);

  ngOnInit(): void {
    const uid = getProfileUserUuid();
    if (!uid) {
      this.loading.set(false);
      this.errorMsg.set('Sign in to see your assessments.');
      return;
    }

    forkJoin({
      plan: this.assignmentApi.getStatus(uid).pipe(
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            return of(null);
          }
          throw err;
        })
      ),
      history: this.sessionApi.listForUser(uid).pipe(catchError(() => of([] as SessionResponseDto[]))),
    }).subscribe({
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

  startCategory(categoryId: number): void {
    const uid = getProfileUserUuid();
    if (!uid) return;
    this.startingCategoryId.set(categoryId);
    this.sessionApi.startSession(uid, categoryId).subscribe({
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

  private formatErr(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const b = err.error;
      if (typeof b === 'string' && b.trim()) return b;
      if (b && typeof b === 'object' && 'message' in b) {
        return String((b as { message: unknown }).message);
      }
      return err.message || `Error ${err.status}`;
    }
    return 'Something went wrong.';
  }
}
