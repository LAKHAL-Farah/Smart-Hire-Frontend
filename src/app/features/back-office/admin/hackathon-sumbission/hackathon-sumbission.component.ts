import { EventService } from './../../../../services/event.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Plus, Download, EllipsisVertical, X, Pen, Trash2, Loader, ChevronLeft, ChevronRight } from 'lucide-angular';
import { HackathonSubmissionService } from '../../../../services/hackathon-submission.service';
import { SubmissionStatus } from '../../../../models/submission-status.enum';
import { HackathonSubmissionDTO } from '../../../../models/hackathon-submission.dto';
import { AINotification } from '../../../../services/ainotification-service.service';

export interface HackathonSubmission {
  id?: number;
  userId?: number;
  eventId?: number;
  projectTitle: string;
  projectDescription?: string;
  repoUrl?: string;
  demoUrl?: string;
  originalityScore?: number;
  feasibilityScore?: number;
  technicalScore?: number;
  overallScore?: number;

  aiFeedback?: string;
  ranking?: number;

  submittedAt?: string;   // ISO date string
  evaluatedAt?: string;   // ISO date string


  status?: SubmissionStatus;

}


@Component({
  selector: 'app-hackathon-sumbission',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './hackathon-sumbission.component.html',
  styleUrl: './hackathon-sumbission.component.scss'
})
export class HackathonSumbissionComponent implements OnInit {

  // Icons
  readonly Search = Search;
  readonly Plus = Plus;
  readonly Download = Download;
  readonly EllipsisVertical = EllipsisVertical;
  readonly X = X;
  readonly Pen = Pen;
  readonly Trash2 = Trash2;
  readonly Loader = Loader;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;

  submissions: HackathonSubmission[] = [];
  loading = false;
  error = '';
  notifications: AINotification[] = [];
  showNotifications = false;
  unreadCount = 0;
  evaluatingId: number | null = null;
  // Filters
  searchQuery = '';
  statusFilter = 'All';
  eventFilter = 'All';
  statusOptions: (SubmissionStatus | 'All')[] = [
    'All',
    SubmissionStatus.SUBMITTED,
    SubmissionStatus.UNDER_REVIEW,
    SubmissionStatus.ACCEPTED,
    SubmissionStatus.REJECTED
  ];

  // Pagination
  currentPage = 1;
  pageSize = 8;

  // Selection
  selectedIds = new Set<number>();

  // Drawer
  drawerOpen = false;
  drawerSubmission: HackathonSubmission | null = null;

  // Modal
  modalOpen = false;
  editingSubmission: HackathonSubmission | null = null;
  formSubmission: HackathonSubmission = this.emptyForm();

  // Menu
  openMenuId: number | null = null;

  constructor(private hackathonSubmissionService: HackathonSubmissionService,private EventService: EventService) {}

  ngOnInit(): void {
    this.loadSubmissions();
    document.addEventListener('click', () => { this.openMenuId = null; });
  }

  emptyForm(): HackathonSubmission {
    // ✅ FIX: was SubmissionStatus.ACCEPTED
    return { userId: 0, eventId: 0, projectTitle: '', projectDescription: '', repoUrl: '', demoUrl: '', status: SubmissionStatus.SUBMITTED };
  }

 // Ajoute cette propriété
eventDomainCache = new Map<number, string>();

// Modifie loadSubmissions()
loadSubmissions(): void {
  this.loading = true;
  this.error = '';
  this.hackathonSubmissionService.getSubmissions().subscribe({
    next: (data) => {
      this.submissions = data;
      this.loading = false;
      this.loadEventDomains(); // ✅ charge les domains après
    },
    error: (err) => { this.error = 'Failed to load submissions.'; this.loading = false; }
  });
}
evaluateSubmission(id: number, event: Event): void {
  event.stopPropagation();
  this.evaluatingId = id;

  this.hackathonSubmissionService.evaluateSubmission(id).subscribe({

    next: (response: any) => {
      this.loadSubmissions();
      this.evaluatingId = null;
      console.log('Evaluation response:', response);
    },
    error: (error:any) => {
      this.evaluatingId = null;
      console.error(error);
      this.error = `Failed to evaluate submission #${id}`;
    }
    // ✅ pas de next — la réponse arrive via WebSocket
  });
}

// ── Panel notifications ──
toggleNotifications(event: Event): void {
  event.stopPropagation();
  this.showNotifications = !this.showNotifications;
  if (this.showNotifications) this.unreadCount = 0;
}

clearNotifications(): void {
  this.notifications = [];
  this.unreadCount = 0;
  this.showNotifications = false;
}
// Ajoute cette méthode
loadEventDomains(): void {
  const uniqueIds = [...new Set(this.submissions.map(s => s.eventId).filter((id): id is number => id != null))];
  uniqueIds.forEach(id => {
    this.EventService.getEventById(id).subscribe({
      next: (data: any) => this.eventDomainCache.set(id, data.domain ?? '—'),
      error: () => this.eventDomainCache.set(id, '—')
    });
  });
}

// Remplace getEventById() par ceci
getEventDomain(id?: number): string {
  if (id == null) return '—';
  return this.eventDomainCache.get(id) ?? '...';
}

  // ── Computed ──────────────────────────────────────────────

  get uniqueEventIds(): number[] {
    return [...new Set(this.submissions.map(s => s.eventId).filter((id): id is number => id != null))];
  }

  get uniqueStatuses(): string[] {
    return [...new Set(this.submissions.map(s => s.status).filter((status): status is SubmissionStatus => status != null))];
  }

  get filteredSubmissions(): HackathonSubmission[] {
    const q = this.searchQuery.toLowerCase();
    return this.submissions.filter(s => {
      const matchSearch = !q ||
        (s.projectTitle?.toLowerCase().includes(q)) ||
        (s.projectDescription?.toLowerCase().includes(q)) ||
        (s.repoUrl?.toLowerCase().includes(q))
        ;
      const matchStatus = this.statusFilter === 'All' || s.status === this.statusFilter;
      const matchEvent = this.eventFilter === 'All' || String(s.eventId) === this.eventFilter;
      return matchSearch && matchStatus && matchEvent;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSubmissions.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginatedSubmissions(): HackathonSubmission[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredSubmissions.slice(start, start + this.pageSize);
  }

  get allChecked(): boolean {
    return this.paginatedSubmissions.length > 0 && this.paginatedSubmissions.every(s => this.selectedIds.has(s.id!));
  }

  get pendingCount(): number { return this.submissions.filter(s => s.status === SubmissionStatus.UNDER_REVIEW).length; }
  get acceptedCount(): number { return this.submissions.filter(s => s.status === SubmissionStatus.ACCEPTED).length; }

  // ── Pagination ────────────────────────────────────────────

  goPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  // ── Selection ─────────────────────────────────────────────

  isSelected(id: number): boolean { return this.selectedIds.has(id); }

  toggleRow(id: number): void {
    this.selectedIds.has(id) ? this.selectedIds.delete(id) : this.selectedIds.add(id);
    this.selectedIds = new Set(this.selectedIds);
  }

  toggleAll(): void {
    if (this.allChecked) {
      this.paginatedSubmissions.forEach(s => this.selectedIds.delete(s.id!));
    } else {
      this.paginatedSubmissions.forEach(s => s.id != null && this.selectedIds.add(s.id));
    }
    this.selectedIds = new Set(this.selectedIds);
  }

  clearSelection(): void { this.selectedIds = new Set(); }

  // ── Menu ──────────────────────────────────────────────────

  toggleMenu(id: number, e: Event): void {
    e.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  // ── Drawer ────────────────────────────────────────────────

  openDrawer(s: HackathonSubmission): void { this.drawerSubmission = s; this.drawerOpen = true; this.openMenuId = null; }
  closeDrawer(): void { this.drawerOpen = false; this.drawerSubmission = null; }

  // ── Modal ─────────────────────────────────────────────────

  openAddModal(): void {
    this.editingSubmission = null;
    this.formSubmission = this.emptyForm();
    this.modalOpen = true;
  }

  openEditModal(s: HackathonSubmission): void {
    this.editingSubmission = s;
    this.formSubmission = { ...s };
    this.modalOpen = true;
    this.closeDrawer();
    this.openMenuId = null;
  }

  closeModal(): void { this.modalOpen = false; this.editingSubmission = null; }

  submitForm(): void {
    this.formSubmission.status = this.formSubmission.status as SubmissionStatus;
    const dto: HackathonSubmission = {
      ...this.formSubmission,
      userId: this.formSubmission.userId ?? 0,
      eventId: this.formSubmission.eventId ?? 0
    };
    if (this.editingSubmission?.id != null) {
      this.hackathonSubmissionService.updateSubmission(this.editingSubmission.id, dto).subscribe({
        next: () => { this.loadSubmissions(); this.closeModal(); },
        error: () => { this.error = 'Failed to update submission.'; }
      });
    } else {
      this.hackathonSubmissionService.addSubmission(dto).subscribe({
        next: () => { this.loadSubmissions(); this.closeModal(); },
        error: () => { this.error = 'Failed to add submission.'; }
      });
    }
  }

  // ── Delete ────────────────────────────────────────────────

  deleteSubmission(id: number): void {
    this.hackathonSubmissionService.deleteSubmission(id).subscribe({
      next: () => { this.loadSubmissions(); this.selectedIds.delete(id); },
      error: () => { this.error = 'Failed to delete submission.'; }
    });
  }

  deleteSelected(): void {
    const ids = [...this.selectedIds];
    ids.forEach(id => this.hackathonSubmissionService.deleteSubmission(id).subscribe({ next: () => this.loadSubmissions() }));
    this.clearSelection();
  }

  // ── Helpers ───────────────────────────────────────────────

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  avatarGradient(userId?: number): string {
    const colors = [
      ['#6366f1','#8b5cf6'], ['#3b82f6','#06b6d4'], ['#10b981','#059669'],
      ['#f59e0b','#ef4444'], ['#ec4899','#8b5cf6'], ['#14b8a6','#3b82f6']
    ];
    const [a, b] = colors[(userId ?? 0) % colors.length];
    return `linear-gradient(135deg, ${a}, ${b})`;
  }

  statusClass(status?: string): string {
    const map: Record<string, string> = {
      'ACCEPTED': 'badge--green',
      'REJECTED': 'badge--red',
      'SUBMITTED': 'badge--amber',
      'UNDER_REVIEW': 'badge--blue'
    };
    return map[status ?? ''] ?? 'badge--gray';
  }

  exportCsv(): void {
    const headers = ['ID', 'User ID', 'Event ID', 'Project Title', 'Status', 'Repo URL', 'Demo URL', 'Submitted At'];
    const rows = this.filteredSubmissions.map(s =>
      [s.id, s.userId, s.eventId, s.projectTitle, s.status, s.repoUrl, s.demoUrl, s.submittedAt].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'submissions.csv'; a.click();
    URL.revokeObjectURL(url);
  }


  
  get paginationStart(): number { return (this.currentPage - 1) * this.pageSize + 1; }
  get paginationEnd(): number { return Math.min(this.currentPage * this.pageSize, this.filteredSubmissions.length); }
}