import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Loader, LucideAngularModule } from 'lucide-angular';
import { EventReviewService } from '../../../../services/event-review.service';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';
import { Event } from '../event-management/event-management.component';

/* ════════════════════════════════════════════════════════════
   INTERFACE — exactement comme le backend
════════════════════════════════════════════════════════════ */
export interface Review {
  id?:         number;
  userId:      number;
  rating:      number;
  comment:     string;
  reviewedAt?: string;
  eventId:     number;
  event?:any;
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, LUCIDE_ICONS],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss',
  
})
export class ReviewsComponent implements OnInit {

  /* ── Data ── */
  reviews: Review[] = [];
  loading = false;
  error   = '';

  /* ── Filters ── */
  searchQuery  = '';
  ratingFilter = 'All';
  eventFilter  = 'All';
  ratingOptions = ['All', '1', '2', '3', '4', '5'];

  /* ── Pagination ── */
  currentPage = 1;
  pageSize    = 10;

  get totalPages(): number {
    return Math.ceil(this.filteredReviews.length / this.pageSize) || 1;
  }

  get paginatedReviews(): Review[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredReviews.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  /* ── Selection ── */
  selectedIds = new Set<number>();
  allChecked  = false;

  /* ── Dropdown ── */
  openMenuId: number | null = null;

  /* ── Drawer ── */
  drawerOpen   = false;
  drawerReview: Review | null = null;

  /* ── Modal add/edit ── */
  modalOpen     = false;
  editingReview: Review | null = null;
formReview: Review = {
  userId: 1,
  rating: 0,
  comment: '',
  eventId: 1
};

  constructor(private eventReviewService: EventReviewService) {}

  /* ════════════════════════ LIFECYCLE ════════════════════════ */

  ngOnInit(): void {
    this.loadReviews();
    this.getReviewByEventId(8);
  }

  loadReviews(): void {
    this.loading = true;
    this.error   = '';
    this.eventReviewService.getReviews().subscribe({
      next: (res: Review[]) => {
        this.reviews = res;
        this.loading = false;
      },
      error: err => {
        this.error   = 'Failed to load reviews.';
        this.loading = false;
        console.error('Error loading reviews', err);
      }
    });
  }

  /* ════════════════════════ COMPUTED ════════════════════════ */

  get filteredReviews(): Review[] {
    const q = this.searchQuery.toLowerCase();
    console.log(this.reviews);
    return this.reviews.filter(r => {
      const matchSearch = !q ||
        r.comment.toLowerCase().includes(q) ||
        String(r.userId).includes(q) ||
        String(r.eventId).includes(q);
      const matchRating = this.ratingFilter === 'All' || r.rating === +this.ratingFilter;
      const matchEvent  = this.eventFilter  === 'All' || r.eventId === +this.eventFilter;
      return matchSearch && matchRating && matchEvent;
    });
  }

  get uniqueEventIds(): number[] {
    return [...new Set(this.reviews.map(r => r.eventId))].sort((a, b) => a - b);
  }

  get avgRating(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
  }

  get fiveStarCount(): number {
    return this.reviews.filter(r => r.rating === 5).length;
  }

  /* ════════════════════════ DISPLAY HELPERS ════════════════════════ */

  avatarGradient(userId: number): string {
    const gradients = [
      'linear-gradient(135deg,#6366f1,#8b5cf6)',
      'linear-gradient(135deg,#06b6d4,#0e7490)',
      'linear-gradient(135deg,#f97316,#ea580c)',
      'linear-gradient(135deg,#ec4899,#db2777)',
      'linear-gradient(135deg,#14b8a6,#0d9488)',
      'linear-gradient(135deg,#3b82f6,#6366f1)',
      'linear-gradient(135deg,#f59e0b,#d97706)',
      'linear-gradient(135deg,#10b981,#059669)',
    ];
    return gradients[userId % gradients.length];
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  /* ════════════════════════ SELECTION ════════════════════════ */

  toggleAll(): void {
    if (this.allChecked) {
      this.selectedIds.clear();
      this.allChecked = false;
    } else {
      this.paginatedReviews.forEach(r => r.id !== undefined && this.selectedIds.add(r.id));
      this.allChecked = true;
    }
  }

  toggleRow(id: number): void {
    this.selectedIds.has(id) ? this.selectedIds.delete(id) : this.selectedIds.add(id);
    this.allChecked = this.paginatedReviews.every(r => r.id !== undefined && this.selectedIds.has(r.id));
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  clearSelection(): void {
    this.selectedIds.clear();
    this.allChecked = false;
  }

  deleteSelected(): void {
    this.selectedIds.forEach(id => this.deleteReview(id));
    this.clearSelection();
  }

  /* ════════════════════════ PAGINATION ════════════════════════ */

  goPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.allChecked  = false;
    }
  }

  /* ════════════════════════ 3-DOTS MENU ════════════════════════ */

  toggleMenu(id: number, $event: MouseEvent): void {
    $event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openMenuId = null;
  }

  /* ════════════════════════ DRAWER ════════════════════════ */

  openDrawer(review: Review): void {
    this.drawerReview = review;
    this.drawerOpen   = true;
    this.openMenuId   = null;
  }

  closeDrawer(): void {
    this.drawerOpen   = false;
    this.drawerReview = null;
  }

  /* ════════════════════════ MODAL ADD / EDIT ════════════════════════ */

  openAddModal(): void {
    this.editingReview = null;
    this.formReview    = { userId: 0, eventId: 0, rating: 5, comment: '', event: null };
    this.modalOpen     = true;
  }

  openEditModal(review: Review): void {
    this.editingReview = review;
    this.formReview    = { ...review };
    this.modalOpen     = true;
    this.closeDrawer();
  }

  closeModal(): void {
    this.modalOpen     = false;
    this.editingReview = null;
    this.formReview    = { userId: 0, eventId: 0, rating: 5, comment: '', event: null };
  }

  setRating(value: number): void {
    this.formReview.rating = value;
  }

  submitForm(): void {
    if (this.editingReview) {
      this.updateReview();
    } else {
      this.addReview();
    }
  }

  /* ════════════════════════ CRUD ACTIONS ════════════════════════ */

  addReview(): void {
    const payload: Review = {
      userId:  this.formReview.userId  ?? 1,
      eventId: this.formReview.eventId ?? 1,
      rating:  this.formReview.rating  ?? 5,
      comment: this.formReview.comment ?? '',
      event: null
    };
    this.eventReviewService.addReview(payload).subscribe({
      next: (res: Review) => {
        this.reviews.unshift(res);
        this.closeModal();
      },
      error: err => console.error('Error adding review', err)
    });
  }

  updateReview(): void {
    if (!this.editingReview?.id) return;
    this.eventReviewService.updateReview(this.editingReview.id, this.formReview).subscribe({
      next: (res: any) => {
        const idx = this.reviews.findIndex(r => r.id === res.id);
        if (idx !== -1) this.reviews[idx] = res;
        this.closeModal();
      },
      error: err => console.error('Error updating review', err)
    });
  }

 getReviewByEventId(eventId: number): void {
  this.eventReviewService.getReviewByEventId(eventId).subscribe({
    next: (event: any) => {
      this.reviews = event.reviews ?? [];
      
      console.log('Reviews for event', eventId, this.reviews);
    }
  });
}
  deleteReview(id: number): void {
    this.eventReviewService.deleteReview(id).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(r => r.id !== id);
        this.selectedIds.delete(id);
        if (this.drawerReview?.id === id) this.closeDrawer();
      },
      error: err => console.error('Error deleting review', err)
    });
  }
}