import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HackathonSubmissionDTO } from '../../../../models/hackathon-submission.dto';
import { HackathonSubmissionService } from '../../../../services/hackathon-submission.service';

@Component({
  selector: 'app-hackathon-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hackathon-submissions.component.html',
  styleUrls: ['./hackathon-submissions.component.scss']
})
export class HackathonSubmissionsComponent implements OnInit, OnDestroy {

  submissions: HackathonSubmissionDTO[] = [];
  loading  = false;
  error    = '';
  search   = '';
  activeFilter = 'all';

  // Modal create / edit
  modalOpen  = false;
  editTarget: HackathonSubmissionDTO | null = null;
  saving     = false;
  form: Partial<HackathonSubmissionDTO> = {};

  // Modal delete
  deleteTarget: HackathonSubmissionDTO | null = null;
  deleting = false;

  // Toast
  toastVisible = false;
  toastMsg     = '';
  toastError   = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  filterTabs = [
    { key: 'all',       label: 'All'       },
    { key: 'submitted', label: 'Submitted' },
    { key: 'pending',   label: 'Pending'   },
    { key: 'evaluated', label: 'Evaluated' },
    { key: 'rejected',  label: 'Rejected'  },
  ];

  private statusColorMap: Record<string, string> = {
    PENDING:   '#a78bfa',
    SUBMITTED: '#4f9eff',
    EVALUATED: '#34d399',
    REJECTED:  '#f87171',
    default:   '#94a3b8',
  };

  constructor(private svc: HackathonSubmissionService) {}

  ngOnInit(): void {
    this.loadSubmissions();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── DATA ─────────────────────────────────────────────────────────────

  loadSubmissions(): void {
    this.loading = true;
    this.error   = '';
    this.svc.getSubmissions().subscribe({
      next: data => {
        this.submissions = data;
        this.loading = false;
      },
      error: () => {
        this.error   = 'Failed to load submissions.';
        this.loading = false;
      }
    });
  }

  // ── COMPUTED ─────────────────────────────────────────────────────────

  get stats() {
    const evaluated = this.submissions.filter(s => s.status === 'EVALUATED');
    const avg = evaluated.length
      ? evaluated.reduce((a, b) => a + (b.overallScore ?? 0), 0) / evaluated.length
      : null;
    return [
      { label: 'Total',          value: this.submissions.length },
      { label: 'Evaluated',      value: evaluated.length },
      { label: 'Pending review', value: this.submissions.filter(s => s.status === 'PENDING' || s.status === 'SUBMITTED').length },
      { label: 'Avg score',      value: avg != null ? avg.toFixed(1) + '/10' : '—' },
    ];
  }

  get filteredSubmissions(): HackathonSubmissionDTO[] {
    const q = this.search.toLowerCase().trim();
    return this.submissions
      .filter(s => {
        const matchFilter =
          this.activeFilter === 'all' ||
          s.status.toLowerCase() === this.activeFilter;
        const matchSearch =
          !q ||
          s.projectTitle.toLowerCase().includes(q) ||
          (s.projectDescription ?? '').toLowerCase().includes(q);
        return matchFilter && matchSearch;
      })
      .sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));
  }

  // ── HELPERS ──────────────────────────────────────────────────────────

  statusColor(status: string): string {
    return this.statusColorMap[status] ?? this.statusColorMap['default'];
  }

  rankClass(rank: number | null | undefined): string {
    if (!rank) return 'rank-default';
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-default';
  }

  pct(score = 0, max = 10): number {
    return Math.min(100, Math.round((score / max) * 100));
  }

  // ── MODAL CREATE / EDIT ───────────────────────────────────────────────

  openModal(sub?: HackathonSubmissionDTO, evalMode = false): void {
    this.editTarget = sub ?? null;
    this.form       = sub ? { ...sub } : { status: 'SUBMITTED' };
    this.saving     = false;
    this.modalOpen  = true;
  }

  closeModal(): void {
    this.modalOpen  = false;
    this.editTarget = null;
    this.saving     = false;
  }

  saveSubmission(): void {
    if (!this.form.projectTitle?.trim()) {
      this.showToast('Project title is required.', true);
      return;
    }

    this.saving = true;
    const payload = {
      ...this.form,
      projectDescription: this.form.projectDescription ?? '',
    } as HackathonSubmissionDTO;

    // Use idLong if available, fall back to id
    const existingId = this.editTarget?.idLong ?? this.editTarget?.id;
    const call$ = existingId
      ? this.svc.updateSubmission(existingId, payload)
      : this.svc.addSubmission(payload);

    call$.subscribe({
      next: () => {
        this.closeModal();
        this.loadSubmissions();
        this.showToast(existingId ? 'Submission updated.' : 'Submission created.');
      },
      error: () => {
        this.showToast('Save failed. Please try again.', true);
        this.saving = false;
      }
    });
  }

  // ── DELETE ────────────────────────────────────────────────────────────

  /**
   * Called from the card "Delete" button — opens the confirmation modal.
   * Uses idLong when available, falls back to id.
   */
  deleteSubmission(id: number | undefined): void {
    if (id == null) {
      this.showToast('Cannot delete: submission ID is missing.', true);
      return;
    }
    // Find the full object so the modal can show the title
    const sub = this.submissions.find(s => (s.idLong ?? s.id) === id || s.id === id);
    this.deleteTarget = sub ?? null;
  }

  confirmDelete(sub: HackathonSubmissionDTO): void {
    const id = sub.idLong ?? sub.id;
    if (id == null) {
      this.showToast('Cannot delete: submission ID is missing.', true);
      return;
    }
    this.deleteTarget = sub;
  }

  doDelete(): void {
    if (!this.deleteTarget) return;

    const id = this.deleteTarget.idLong ?? this.deleteTarget.id;
    if (id == null) {
      this.showToast('Cannot delete: ID is undefined.', true);
      this.deleteTarget = null;
      return;
    }

    this.deleting = true;
    this.svc.deleteSubmission(id).subscribe({
      next: () => {
        this.submissions  = this.submissions.filter(
          s => (s.idLong ?? s.id) !== id
        );
        this.deleteTarget = null;
        this.deleting     = false;
        this.showToast('Submission deleted successfully.');
      },
      error: (err: any) => {
        this.deleting = false;
        const msg =
          err.status === 404 ? 'Submission not found on server.' :
          err.status === 400 ? 'Bad request: submission could not be deleted.' :
          'Delete failed — please try again.';
        this.showToast(msg, true);
      }
    });
  }

  // ── TOAST ─────────────────────────────────────────────────────────────

  showToast(msg: string, isError = false): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg     = msg;
    this.toastError   = isError;
    this.toastVisible = true;
    this.toastTimer   = setTimeout(() => { this.toastVisible = false; }, 3500);
  }
}