import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { EventService } from '../../../../services/event.service';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';
import { Review } from '../reviews/reviews.component';

/* ════════════════════════════════════════════════════════════
   INTERFACES — exactement comme le backend
════════════════════════════════════════════════════════════ */

export type EventType   = 'CONGRESS' | 'HACKATHON' | 'WORKSHOP' | 'MEETUP' | 'CONFERENCE';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'FLAGGED';

export interface EventTag {
  id: number;
  name: string;
}

export interface Event {
  reviews?: Review[];
    id:                   number;
  title:                string;
  description:          string;
  type:                 EventType;
  status:               EventStatus;
  location:             string;
  online:               boolean;
  onlineUrl?:           string;
  domain:               string;
  startDate:            string;   // "2026-04-10T09:00:00"
  endDate:              string;
  maxCapacity:          number;
  currentRegistrations: number;
  organizerId:          number;
  aiSummary?:           string;
  createdAt?:           string;
  tags:                 EventTag[];
}

/* ════════════════════════════════════════════════════════════
   COMPOSANT
════════════════════════════════════════════════════════════ */

@Component({
  selector: 'app-event-management',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule,LUCIDE_ICONS],
  templateUrl: './event-management.component.html',
  styleUrl: './event-management.component.scss'
})
export class EventManagementComponent implements OnInit {

  /* ── Raw data from backend ── */
  events: Event[] = [];
  loading = false;
  error   = '';

  /* ── Filters ── */
  searchQuery  = '';
  statusFilter = 'All';
  typeFilter   = 'All';
  dateFilter   = 'All';

  statuses   = ['All', 'DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'FLAGGED'];
  types      = ['All', 'CONGRESS', 'HACKATHON', 'WORKSHOP', 'MEETUP', 'CONFERENCE'];
  dateRanges = ['All', 'Today', 'This Week', 'This Month'];

  /* ── Pagination ── */
  currentPage = 1;
  pageSize    = 10;

  get totalPages(): number {
    return Math.ceil(this.filteredEvents.length / this.pageSize) || 1;
  }

  get paginatedEvents(): Event[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEvents.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  /* ── Selection / Bulk ── */
  selectedIds = new Set<number>();
  allChecked  = false;

  /* ── Dropdown menu ── */
  openMenuId: number | null = null;

  /* ── Drawer ── */
  drawerOpen  = false;
  drawerEvent: Event | null = null;

  /* ── Add form ── */
  addModalOpen = false;
  newEvent: Partial<Event> = {};

  constructor(private eventService: EventService) {}

  /* ════════════════════════ LIFECYCLE ════════════════════════ */

  ngOnInit(): void {
    this.loadEvents();
    
  }

  loadEvents(): void {
    this.loading = true;
    this.error   = '';
    this.eventService.getEvents().subscribe({
      next: (data: Event[]) => {
        this.events  = data;
        this.loading = false;
      },
      error: (err) => {
        this.error   = 'Failed to load events.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  /* ════════════════════════ COMPUTED ════════════════════════ */

  get flaggedCount(): number {
    return this.events.filter(e => e.status === 'FLAGGED').length;
  }

  get filteredEvents(): Event[] {
    const q = this.searchQuery.toLowerCase();
    return this.events.filter(e => {
      const matchSearch = !q ||
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.domain.toLowerCase().includes(q);
      const matchStatus = this.statusFilter === 'All' || e.status === this.statusFilter;
      const matchType   = this.typeFilter   === 'All' || e.type   === this.typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }

  /* ════════════════════════ DISPLAY HELPERS ════════════════════════ */

  /** "Conférence Java Spring" → "CJ" */
  getInitials(title: string): string {
    return (title ?? '')
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase() || 'EV';
  }

  /** Gradient stable basé sur l'id */
  logoGradient(id: number): string {
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
    return gradients[id % gradients.length];
  }

  /** "2026-04-10T09:00:00" → "Apr 10, 2026" */
  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  /** Classe CSS du badge status */
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT:     'sbadge--pending',
      PUBLISHED: 'sbadge--active',
      ONGOING:   'sbadge--active',
      COMPLETED: 'sbadge--closed',
      CANCELLED: 'sbadge--closed',
      FLAGGED:   'sbadge--flagged',
    };
    return map[status] ?? 'sbadge--closed';
  }

  /** Classe CSS du badge location */
  getLocationClass(online: boolean, location: string): string {
    if (online && !location) return 'lbadge--remote';
    if (online && location)  return 'lbadge--hybrid';
    return 'lbadge--onsite';
  }

  /** Libellé location lisible */
  getLocationType(online: boolean, location: string): string {
    if (online && !location) return 'Remote';
    if (online && location)  return 'Hybrid';
    return 'On-site';
  }

  /** Libellé status lisible */
  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT:     'Draft',
      PUBLISHED: 'Published',
      ONGOING:   'Ongoing',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      FLAGGED:   'Flagged',
    };
    return map[status] ?? status;
  }

  /* ════════════════════════ SELECTION ════════════════════════ */

  toggleAll(): void {
    if (this.allChecked) {
      this.selectedIds.clear();
      this.allChecked = false;
    } else {
      this.paginatedEvents.forEach(e => this.selectedIds.add(e.id));
      this.allChecked = true;
    }
  }

  toggleRow(id: number): void {
    this.selectedIds.has(id) ? this.selectedIds.delete(id) : this.selectedIds.add(id);
    this.allChecked = this.paginatedEvents.every(e => this.selectedIds.has(e.id));
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  clearSelection(): void {
    this.selectedIds.clear();
    this.allChecked = false;
  }

  /* ════════════════════════ PAGINATION ════════════════════════ */

  goPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.allChecked  = false;
    }
  }

  /* ════════════════════════ FILTER SHORTCUTS ════════════════════════ */

  showFlagged(): void {
    this.statusFilter = 'FLAGGED';
    this.currentPage  = 1;
  }

  /* ════════════════════════ DRAWER ════════════════════════ */

  openDrawer(event: Event): void {
    this.drawerEvent = event;
    this.drawerOpen  = true;
    this.openMenuId  = null;
  }

  closeDrawer(): void {
    this.drawerOpen  = false;
    this.drawerEvent = null;
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

  /* ════════════════════════ ACTIONS ════════════════════════ */

  unflagEvent(event: Event): void {
    this.eventService.updateEvent(event.id, { status: 'DRAFT' }).subscribe({
      next: () => {
        event.status = 'DRAFT';
        if (this.drawerEvent?.id === event.id) this.drawerEvent = { ...event };
      },
      error: err => console.error('Unflag error', err)
    });
  }

  closeEvent(event: Event): void {
    this.eventService.updateEvent(event.id, { status: 'COMPLETED' }).subscribe({
      next: () => {
        event.status = 'COMPLETED';
        if (this.drawerEvent?.id === event.id) this.drawerEvent = { ...event };
      },
      error: err => console.error('Close error', err)
    });
  }

  removeEvent(event: Event): void {
    this.eventService.deleteEvent(event.id).subscribe({
      next: () => {
        this.events = this.events.filter(e => e.id !== event.id);
        this.selectedIds.delete(event.id);
        this.closeDrawer();
      },
      error: err => console.error('Remove error', err)
    });
  }

  editEvent(event: Event): void {
    this.openMenuId = null;
    // TODO: ouvrir modal edit
    console.log('Edit', event);
  }

  /* ════════════════════════ ADD MODAL ════════════════════════ */

  openAddModal(): void {
    this.newEvent = {
      title:                '',
      description:          '',
      type:                 'CONFERENCE',
      status:               'DRAFT',
      location:             '',
      online:               false,
      onlineUrl:            '',
      domain:               '',
      startDate:            '',
      endDate:              '',
      maxCapacity:          0,
      currentRegistrations: 0,
      organizerId:          1,
      tags:                 [],
    };
    this.addModalOpen = true;
  }

  closeAddModal(): void {
    this.addModalOpen = false;
  }

  addEvent(): void {
    this.eventService.addEvent(this.newEvent).subscribe({
      next: (res: Event) => {
        this.events.unshift(res);
        this.closeAddModal();
      },
      error: err => console.error('Add error', err)
    });
  }
  getTagsByEventId(eventId: number): void {
    this.eventService.getEventById(eventId).subscribe({
      next: (res: any) => {
        console.log('Event details:', res as Event);
      },
      error: err => console.error('Error fetching event details', err)
    });
  }

}