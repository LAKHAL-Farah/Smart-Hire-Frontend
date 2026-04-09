import { Component, OnInit } from '@angular/core';
import { HackathonSubmissionDTO } from '../../../../models/hackathon-submission.dto';
import { HackathonSubmissionService } from '../../../../services/hackathon-submission.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-hackathon-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hackathon-submissions.component.html',
  styleUrls: ['./hackathon-submissions.component.scss']
})
export class HackathonSubmissionsComponent implements OnInit {

  submissions: HackathonSubmissionDTO[] = [];
  loading = false;
  error = '';
  search = '';
  activeFilter = 'all';
  modalOpen = false;
  editTarget: any|null = null;
  deleteTarget: any|null = null;
  deleting = false;
  toastVisible = false;
  toastMsg = '';
  toastError = false;

  filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'pending', label: 'Pending' },
    { key: 'evaluated', label: 'Evaluated' },
    { key: 'rejected', label: 'Rejected' },
  ];

  form: Partial<HackathonSubmissionDTO> = {};

  get stats() {
    const evaluated = this.submissions.filter(s => s.status === 'EVALUATED');
    const avg = evaluated.length
      ? evaluated.reduce((a, b) => a + (b.overallScore || 0), 0) / evaluated.length
      : null;
    return [
      { label: 'Total', value: this.submissions.length },
      { label: 'Evaluated', value: evaluated.length },
      { label: 'Pending review', value: this.submissions.filter(s => s.status === 'PENDING' || s.status === 'SUBMITTED').length },
      { label: 'Avg score', value: avg != null ? avg.toFixed(1) + '/10' : '—' },
    ];
  }

  get filteredSubmissions() {
    const q = this.search.toLowerCase();
    return this.submissions.filter(s => {
   
      const matchFilter = this.activeFilter === 'all' || s.status.toLowerCase() === this.activeFilter;
      const matchSearch = !q || s.projectTitle.toLowerCase().includes(q) || (s.projectDescription || '').toLowerCase().includes(q);
      return matchFilter && matchSearch;
      console.log(this.submissions);
    }).sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));
  }

  constructor(private svc: HackathonSubmissionService) {}

  ngOnInit() {
    this.loadSubmissions();
  }

  loadSubmissions() {
    this.loading = true;
    this.svc.getSubmissions().subscribe({
      next: data => { this.submissions = data ; this.loading = false; },
      error: () => { this.error = 'Failed to load submissions.'; this.loading = false; }
    });
  }

  statusColor(status: string) {
    const map: Record<string, string> = {
      PENDING: '#534AB7', SUBMITTED: '#185FA5', EVALUATED: '#3B6D11', REJECTED: '#A32D2D'
    };
    return map[status] || '#888780';
  }

rankClass(rank: number | null | undefined): string {
  if (!rank) return 'rank-default';

  if (rank === 1) return 'rank-gold';
  if (rank === 2) return 'rank-silver';
  if (rank === 3) return 'rank-bronze';

  return 'rank-default';
}
  openModal(sub?: HackathonSubmissionDTO, evalMode = false) {
    this.editTarget = sub || null;
    this.form = sub ? { ...sub } : { status: 'SUBMITTED' };
    this.modalOpen = true;
  }

  closeModal() { this.modalOpen = false; this.editTarget = null; }

  saveSubmission() {
    if (!this.form.projectTitle) { this.showToast('Project title is required', true); return; }
    const formData = { ...this.form, projectDescription: this.form.projectDescription || '' } as any;
    const call = this.editTarget
      ? this.svc.updateSubmission(this.editTarget.idLong!, formData)
      : this.svc.addSubmission(formData);
    call.subscribe({
      next: () => { this.closeModal(); this.loadSubmissions(); this.showToast('Submission saved'); },
      error: () => this.showToast('Save failed', true)
    });
  }




deleteSubmission(id: number) {
  if (id == null) {
    this.showToast('Cannot delete: submission ID is missing', true);
    return;
  }
  Swal.fire({
    title: 'Are you sure?',
    text: "This action cannot be undone!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, delete it!'
  }).then((result:any) =>  {
    if (result.isConfirmed) {
      this.svc.deleteSubmission(id).subscribe({
        next: () => {
          this.loadSubmissions();
          Swal.fire('Deleted!', 'Submission has been deleted.', 'success');
        },
        error: () => {
          Swal.fire('Error!', 'Delete failed.', 'error');
        }
      });
    }
  });
}
  confirmDelete(sub: any): void {
  if (sub.idLong == null) {
    this.showToast('Cannot delete: submission ID is missing', true);
    return;
  }
  this.deleteTarget = sub;
}

doDelete(): void {
  if (!this.deleteTarget) return;

  if (this.deleteTarget.idLong == null) {
    this.showToast('Cannot delete: ID is undefined', true);
    this.deleteTarget = null;
    return;
  }

  this.deleting = true;
  this.svc.deleteSubmission(this.deleteTarget.idLong).subscribe({
    next: () => {
      this.deleteTarget = null;
      this.deleting     = false;
      this.loadSubmissions();
      this.showToast('Submission deleted successfully');
    },
    error: (err) => {
      this.deleting = false;
      const msg = err.status === 400
        ? 'Bad request: submission could not be deleted'
        : err.status === 404
        ? 'Submission not found on server'
        : 'Delete failed — please try again';
      this.showToast(msg, true);
    }
  });
}
formatScore(score?: number | null): string {
  return score != null ? `${score.toFixed(2)} / 100` : '0 / 100';
}
  showToast(msg: string, isError = false) {
    this.toastMsg = msg; this.toastError = isError; this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 2500);
  }
  getStroke(score?: number | null): number {
  return (score ?? 0) * 9.42;
}
}