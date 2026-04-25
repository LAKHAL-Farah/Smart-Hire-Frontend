import { Injectable, inject, signal, effect } from '@angular/core';
import { interval, Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AssessmentAdminApiService, PendingAssignmentRow, AssessmentSessionAdminRow } from './assessment-admin-api.service';

/**
 * Real-time updates service that polls the backend for:
 * - New pending assignments
 * - New completed sessions
 * - Updated session statuses
 *
 * Uses Angular signals for reactive updates and auto-refresh every 3-5 seconds.
 */
@Injectable({ providedIn: 'root' })
export class RealTimeUpdatesService {
  private readonly api = inject(AssessmentAdminApiService);

  // Signals for reactive updates
  pendingAssignments = signal<PendingAssignmentRow[]>([]);
  completedSessions = signal<AssessmentSessionAdminRow[]>([]);
  pendingRelease = signal<AssessmentSessionAdminRow[]>([]);
  isPolling = signal(false);
  lastUpdateTime = signal<Date | null>(null);

  // Search signals
  searchPendingAssignments = signal('');
  searchCompletedSessions = signal('');
  searchPendingRelease = signal('');

  // Computed filtered results
  filteredPendingAssignments = signal<PendingAssignmentRow[]>([]);
  filteredCompletedSessions = signal<AssessmentSessionAdminRow[]>([]);
  filteredPendingRelease = signal<AssessmentSessionAdminRow[]>([]);

  private destroy$ = new Subject<void>();
  private pollInterval = 4000; // 4 seconds (3-5 range)

  constructor() {
    // Set up effects to filter results when search or data changes
    effect(() => {
      const search = this.searchPendingAssignments();
      const data = this.pendingAssignments();
      this.filteredPendingAssignments.set(this.filterPendingAssignments(data, search));
    });

    effect(() => {
      const search = this.searchCompletedSessions();
      const data = this.completedSessions();
      this.filteredCompletedSessions.set(this.filterCompletedSessions(data, search));
    });

    effect(() => {
      const search = this.searchPendingRelease();
      const data = this.pendingRelease();
      this.filteredPendingRelease.set(this.filterPendingRelease(data, search));
    });
  }

  /**
   * Start polling for real-time updates
   */
  startPolling(): void {
    if (this.isPolling()) {
      return; // Already polling
    }

    this.isPolling.set(true);
    this.performUpdate(); // Initial update

    interval(this.pollInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.performUpdate();
      });
  }

  /**
   * Stop polling for updates
   */
  stopPolling(): void {
    this.isPolling.set(false);
    this.destroy$.next();
  }

  /**
   * Perform a single update cycle
   */
  private performUpdate(): void {
    this.api.listPendingAssignments().subscribe({
      next: (data) => {
        this.pendingAssignments.set(data);
      },
      error: () => {
        // Keep previous data on error
      },
    });

    this.api.listSessionsPendingRelease().subscribe({
      next: (data) => {
        this.pendingRelease.set(data);
      },
      error: () => {
        // Keep previous data on error
      },
    });

    this.api.listAllCompletedSessions().subscribe({
      next: (data) => {
        this.completedSessions.set(data);
      },
      error: () => {
        // Keep previous data on error
      },
    });

    this.lastUpdateTime.set(new Date());
  }

  /**
   * Manually refresh all data
   */
  refreshAll(): void {
    this.performUpdate();
  }

  /**
   * Update search term for pending assignments (debounced)
   */
  updateSearchPendingAssignments(term: string): void {
    this.searchPendingAssignments.set(term);
  }

  /**
   * Update search term for completed sessions (debounced)
   */
  updateSearchCompletedSessions(term: string): void {
    this.searchCompletedSessions.set(term);
  }

  /**
   * Update search term for pending release (debounced)
   */
  updateSearchPendingRelease(term: string): void {
    this.searchPendingRelease.set(term);
  }

  /**
   * Filter pending assignments by user ID or situation/career path
   */
  private filterPendingAssignments(data: PendingAssignmentRow[], search: string): PendingAssignmentRow[] {
    if (!search.trim()) {
      return data;
    }

    const term = search.toLowerCase();
    return data.filter((row) => {
      return (
        row.userId.toLowerCase().includes(term) ||
        (row.situation?.toLowerCase().includes(term) ?? false) ||
        (row.careerPath?.toLowerCase().includes(term) ?? false)
      );
    });
  }

  /**
   * Filter completed sessions by category, user ID, or candidate name
   */
  private filterCompletedSessions(data: AssessmentSessionAdminRow[], search: string): AssessmentSessionAdminRow[] {
    if (!search.trim()) {
      return data;
    }

    const term = search.toLowerCase();
    return data.filter((row) => {
      return (
        row.categoryTitle.toLowerCase().includes(term) ||
        row.userId.toLowerCase().includes(term) ||
        (row.candidateDisplayName?.toLowerCase().includes(term) ?? false) ||
        (row.categoryCode?.toLowerCase().includes(term) ?? false)
      );
    });
  }

  /**
   * Filter pending release sessions by category, user ID, or candidate name
   */
  private filterPendingRelease(data: AssessmentSessionAdminRow[], search: string): AssessmentSessionAdminRow[] {
    if (!search.trim()) {
      return data;
    }

    const term = search.toLowerCase();
    return data.filter((row) => {
      return (
        row.categoryTitle.toLowerCase().includes(term) ||
        row.userId.toLowerCase().includes(term) ||
        (row.candidateDisplayName?.toLowerCase().includes(term) ?? false) ||
        (row.categoryCode?.toLowerCase().includes(term) ?? false)
      );
    });
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.stopPolling();
  }
}
