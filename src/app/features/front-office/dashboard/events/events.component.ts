import { EventSpeakersComponent } from './../../../back-office/admin/event-speaker/event-speaker.component';
import { EventReviewService } from './../../../../services/event-review.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../../services/event.service';
import { NotificationService } from '../../../../services/notification-service.service';
import { Subscription } from 'rxjs';
import { EventMapComponent } from '../../../../shared/event-map/event-map.component';
import { EventQrcodeComponent } from '../qrcode/qrcode.component';

export type EventType = 'Conference' | 'Workshop' | 'Networking' | 'Webinar' | 'Hackathon';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface EventModel {
  id?: number;
  title: string;
  type: EventType;
  status: EventStatus;
  startDate: string;
  time?: string;
  location?: string;
  capacity?: number;
  registered?: number;
  registeredUsers?: number[];
  description?: string;
  organizer?: string;
  currentRegistrations?: number;
  domain?: string;
  aiSummary?: string;
  reviews?: Review[];
  lat?: number;
  lng?: number;
  full?: boolean;
  maxCapacity?: number;
  currentParticipants?: number;
  datetime?: any;
}

export interface Review {
  id?: number;
  userId: number;
  eventId: number;
  rating: number;
  comment: string;
  reviewedAt?: string;
  event?: EventModel[];
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, EventMapComponent, EventQrcodeComponent, EventSpeakersComponent],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit, OnDestroy {

  // ─── WebSocket Notifications ──────────────────────────────────
  notifications: string[] = [];
  private notifSub!: Subscription;
  showToast: boolean | undefined;

  // ─── Events ───────────────────────────────────────────────────
  events: EventModel[] = [];
  loading = false;
  error = '';

  // ─── Filters & Search ─────────────────────────────────────────
  search = '';
  activeFilter = 'all';
  filterTabs = [
    { key: 'all',        label: 'All events'  },
    { key: 'upcoming',   label: 'Upcoming'    },
    { key: 'ongoing',    label: 'Ongoing'     },
    { key: 'completed',  label: 'Completed'   },
    { key: 'Workshop',   label: 'Workshops'   },
    { key: 'Conference', label: 'Conferences' },
  ];

  eventTypes:    EventType[]   = ['Conference', 'Workshop', 'Networking', 'Webinar', 'Hackathon'];
  eventStatuses: EventStatus[] = ['upcoming', 'ongoing', 'completed', 'cancelled'];

  private typeColorMap: Record<string, string> = {
    Conference: '#4f9eff',
    Workshop:   '#34d399',
    Networking: '#f59e0b',
    Webinar:    '#a78bfa',
    Hackathon:  '#f472b6',
    default:    '#94a3b8',
  };

  // ─── Modal Create / Edit ──────────────────────────────────────
  modalOpen = false;
  editId: number | null = null;
  saving = false;
  form: EventModel = this.emptyForm();

  // ─── Modal Delete ─────────────────────────────────────────────
  deleteTarget: EventModel | null = null;
  deleting = false;

  // ─── Modal Detail ─────────────────────────────────────────────
  detailModalOpen = false;
  detailLoading = false;
  detailEvent: EventModel | null = null;
  registering = false;

  // ─── AI Summary ───────────────────────────────────────────────
  generatingSummary = false;
  summaryEventId: number | null = null;

  // ─── Toast ────────────────────────────────────────────────────
  toastMsg = '';
  toastError = false;
  toastVisible = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Reviews ──────────────────────────────────────────────────
  reviews: Review[] = [];
  reviewsLoading = false;
  reviewsError = '';

  reviewFormOpen = false;
  reviewForm: { rating: number; comment: string } = { rating: 0, comment: '' };
  reviewHover = 0;
  reviewSubmitting = false;

  reviewEditingId: number | null = null;
  reviewEditForm: { rating: number; comment: string } = { rating: 0, comment: '' };
  reviewEditHover = 0;
  reviewSavingEdit = false;

  reviewDeletingId: number | null = null;

  readonly stars = [1, 2, 3, 4, 5];

  // ─── Speakers ─────────────────────────────────────────────────
  speakersModalOpen = false;
  selectedEventIdForSpeakers: number | null = null;

  // ─── Recommendations ──────────────────────────────────────────
  recommendations: any ;
  recoLoading = false;
  recoPanel = false;
  private recoSub!: Subscription;
  readonly userId = 1777062013327;

  // ─── QR Modal ─────────────────────────────────────────────────
  qrModalOpen   = false;
  qrEvent: EventModel | null = null;
  qrRevealed    = false;
  qrImageLoaded = false;
  qrCopied      = false;
  canNativeShare = !!navigator.share;

  inlineQrRevealed = false;
  inlineQrLoaded   = false;

  constructor(
    private eventService: EventService,
    private notifService: NotificationService,
    private eventReviewService: EventReviewService
    // TODO: injecter AuthService ici pour getCurrentUserId() réel
    // private authService: AuthService
  ) {}

  // ─── Lifecycle ────────────────────────────────────────────────

  ngOnInit(): void {
    this.fetchEvents();
    this.notifService.connect();
    this.notifSub = this.notifService.notification$.subscribe((msg: string) => {
      this.notifications.unshift(msg);
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n !== msg);
      }, 10000);
    });
    this.startRecoPolling();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.notifSub?.unsubscribe();
    this.notifService.disconnect();
    this.recoSub?.unsubscribe();
  }

  // ─── Helpers ──────────────────────────────────────────────────

  encodeLocation(loc: string): string {
    return encodeURIComponent(loc);
  }

  formatDate(date: string): string {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0];
  }

  getGoogleCalendarUrl(event: any): string {
    const start = new Date(event.startDate);
    const end   = new Date(start);
    end.setHours(start.getHours() + 2);
    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    return `https://www.google.com/calendar/render?action=TEMPLATE`
      + `&text=${encodeURIComponent(this.detailEvent?.title || '')}`
      + `&dates=${fmt(start)}/${fmt(end)}`
      + `&details=${encodeURIComponent(this.detailEvent?.description || '')}`
      + `&location=${encodeURIComponent(this.detailEvent?.location || '')}`;
  }

  onAddToCalendar(): void {
    this.toastMsg  = 'Ajouté au calendrier 📅';
    this.showToast = true;
  }

  typeColor(type: string | undefined): string {
    return this.typeColorMap[type ?? 'default'] ?? this.typeColorMap['default'];
  }

  pct(registered = 0, capacity = 0): number {
    if (!capacity) return 0;
    return Math.min(100, Math.round((registered / capacity) * 100));
  }

  emptyForm(): EventModel {
    return {
      title: '', type: 'Conference', status: 'upcoming',
      startDate: '', time: '09:00', location: '', capacity: 50,
      registered: 0, description: '', organizer: '',
    };
  }

  private getCurrentUserId(): number {
    // TODO: return this.authService.currentUser?.id ?? 0;
    return this.userId;
  }

  isEventFull(e: EventModel): boolean {
    const participants = e.currentParticipants ?? e.currentRegistrations ?? e.registered ?? 0;
    const capacity     = e.maxCapacity ?? e.capacity ?? 0;
    return e.full === true || (capacity > 0 && participants >= capacity);
  }

  // ─── Data ─────────────────────────────────────────────────────

  fetchEvents(): void {
    this.loading = true;
    this.error   = '';
    this.eventService.getEvents().subscribe({
      next:  (data) => { this.events = data; this.loading = false; },
      error: ()     => { this.error = 'Failed to load events.'; this.loading = false; }
    });
  }

  // ─── Computed ─────────────────────────────────────────────────

  get filteredEvents(): EventModel[] {
    const q = this.search.toLowerCase().trim();
    return this.events.filter(e => {
      const matchSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.location?.toLowerCase().includes(q) ?? false) ||
        (e.type?.toLowerCase().includes(q)     ?? false) ||
        (e.startDate?.toLowerCase().includes(q) ?? false);
      const matchTab =
        this.activeFilter === 'all' ||
        e.status === this.activeFilter ||
        e.type   === this.activeFilter;
      return matchSearch && matchTab;
    });
  }

  get stats() {
    const total     = this.events.length;
    const upcoming  = this.events.filter(e => e.status === 'upcoming').length;
    const completed = this.events.filter(e => e.status === 'completed').length;
    const totalReg  = this.events.reduce(
      (sum, e) => sum + (e.currentRegistrations ?? e.registered ?? 0), 0
    );
    return [
      { value: total,                     label: 'Total Events'        },
      { value: upcoming,                  label: 'Upcoming'            },
      { value: completed,                 label: 'Completed'           },
      { value: totalReg.toLocaleString(), label: 'Total Registrations' },
    ];
  }

  // ─── Reviews: computed ────────────────────────────────────────

  get reviewAverage(): number {
    if (!this.reviews.length) return 0;
    const sum = this.reviews.reduce((a, r) => a + r.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  get reviewDistribution(): { star: number; count: number; pct: number }[] {
    return [5, 4, 3, 2, 1].map(star => {
      const count = this.reviews.filter(r => r.rating === star).length;
      const pct   = this.reviews.length
        ? Math.round((count / this.reviews.length) * 100)
        : 0;
      return { star, count, pct };
    });
  }

  reviewStarFilled(star: number, rating: number, hover: number): boolean {
    return star <= (hover || rating);
  }

  reviewRatingLabel(rating: number): string {
    return (
      { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' } as any
    )[rating] ?? '';
  }

  // ─── Reviews: load ────────────────────────────────────────────

  private loadReviews(eventId: number): void {
    this.reviewsLoading = true;
    this.reviewsError   = '';
    this.eventReviewService.getReviewByEventId(eventId).subscribe({
      next:  (data: any) => {
        this.reviews        = data.reviews ?? [];
        this.reviewsLoading = false;
      },
      error: () => {
        this.reviewsError   = 'Failed to load reviews.';
        this.reviewsLoading = false;
      }
    });
  }

  // ─── Reviews: create ─────────────────────────────────────────

  openReviewForm(): void {
    this.reviewForm    = { rating: 0, comment: '' };
    this.reviewHover   = 0;
    this.reviewFormOpen = true;
  }

  closeReviewForm(): void {
    this.reviewFormOpen   = false;
    this.reviewSubmitting = false;
  }

  submitReview(): void {
    if (!this.reviewForm.rating)         { this.toast('Please select a rating.', true); return; }
    if (!this.reviewForm.comment.trim()) { this.toast('Please write a comment.', true); return; }
    if (!this.detailEvent?.id)           return;

    this.reviewSubmitting = true;
    const payload: Review = {
      userId:  this.getCurrentUserId(),
      eventId: this.detailEvent.id,
      rating:  this.reviewForm.rating,
      comment: this.reviewForm.comment.trim(),
    };

    this.eventReviewService.addReview(payload).subscribe({
      next: (created: Review) => {
        this.reviews = [created, ...this.reviews];
        this.closeReviewForm();
        this.toast('✅ Review submitted!');
      },
      error: () => {
        this.toast('❌ Failed to submit review.', true);
        this.reviewSubmitting = false;
      }
    });
  }

  // ─── Reviews: edit ────────────────────────────────────────────

  startEditReview(review: Review): void {
    this.reviewEditingId = review.id!;
    this.reviewEditForm  = { rating: review.rating, comment: review.comment };
    this.reviewEditHover = 0;
  }

  cancelEditReview(): void {
    this.reviewEditingId  = null;
    this.reviewSavingEdit = false;
  }

  saveEditReview(review: any): void {
    if (!this.reviewEditForm.rating)         { this.toast('Rating required.', true);  return; }
    if (!this.reviewEditForm.comment.trim()) { this.toast('Comment required.', true); return; }

    this.reviewSavingEdit = true;
    const payload = {
      eventId: review.eventId ?? review.event?.id,
      userId:  review.userId,
      rating:  this.reviewEditForm.rating,
      comment: this.reviewEditForm.comment.trim(),
    };

    this.eventReviewService.updateReview(review.id!, payload).subscribe({
      next: (updated: any) => {
        this.reviews          = this.reviews.map(r =>
          r.id === review.id ? { ...r, ...updated } : r
        );
        this.reviewEditingId  = null;
        this.reviewSavingEdit = false;
        this.toast('✏️ Review updated.');
      },
      error: () => {
        this.toast('❌ Update failed.', true);
        this.reviewSavingEdit = false;
      }
    });
  }

  // ─── Reviews: delete ──────────────────────────────────────────

  deleteReview(id: number): void {
    this.reviewDeletingId = id;
    this.eventReviewService.deleteReview(id).subscribe({
      next: () => {
        this.reviews          = this.reviews.filter(r => r.id !== id);
        this.reviewDeletingId = null;
        this.toast('🗑️ Review deleted.');
      },
      error: () => {
        this.toast('❌ Delete failed.', true);
        this.reviewDeletingId = null;
      }
    });
  }

  // ─── Create / Edit Modal ──────────────────────────────────────

  openModal(event?: EventModel): void {
    this.form      = event ? { ...event } : this.emptyForm();
    this.editId    = event?.id ?? null;
    this.saving    = false;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editId    = null;
    this.saving    = false;
  }

  save(): void {
    if (!this.form.title?.trim()) { this.toast('Title is required.', true);      return; }
    if (!this.form.startDate)     { this.toast('Start date is required.', true); return; }

    this.saving = true;
    const request$ = this.editId
      ? this.eventService.updateEvent(this.editId, this.form)
      : this.eventService.addEvent(this.form);

    request$.subscribe({
      next: (saved: EventModel) => {
        if (this.editId) {
          this.events = this.events.map(e =>
            e.id === this.editId ? { ...e, ...saved } : e
          );
          this.toast('Event updated.');
        } else {
          this.events = [saved, ...this.events];
          this.toast('Event created.');
        }
        this.closeModal();
      },
      error: () => { this.toast('Error while saving.', true); this.saving = false; }
    });
  }

  // ─── Delete Modal ─────────────────────────────────────────────

  confirmDelete(event: EventModel): void { this.deleteTarget = event; }

  doDelete(): void {
    if (!this.deleteTarget?.id) return;
    this.deleting = true;
    this.eventService.deleteEvent(this.deleteTarget.id).subscribe({
      next: () => {
        this.events       = this.events.filter(e => e.id !== this.deleteTarget!.id);
        this.deleteTarget = null;
        this.deleting     = false;
        this.toast('Event deleted.');
      },
      error: () => { this.toast('Delete failed.', true); this.deleting = false; }
    });
  }

  // ─── Detail Modal ─────────────────────────────────────────────

  openDetailModal(id: number): void {
    this.detailModalOpen = true;
    this.detailLoading   = true;
    this.detailEvent     = null;
    this.registering     = false;
    this.reviews         = [];
    this.reviewFormOpen  = false;
    this.reviewEditingId = null;
    this.selectedEventIdForSpeakers = id;

    this.eventService.getEventById(id).subscribe({
      next: (event: any) => {
        this.detailEvent   = event;
        this.detailLoading = false;
        this.loadReviews(id);
      },
      error: () => {
        this.toast('Error loading details.', true);
        this.detailLoading = false;
        this.closeDetailModal();
      }
    });
  }

  closeDetailModal(): void {
    this.detailModalOpen            = false;
    this.detailEvent                = null;
    this.detailLoading              = false;
    this.registering                = false;
    this.reviews                    = [];
    this.reviewFormOpen             = false;
    this.reviewEditingId            = null;
    this.selectedEventIdForSpeakers = null;
  }

  // ─── AI Summary ───────────────────────────────────────────────

  generateSummary(eventId: number): void {
    if (this.generatingSummary) return;
    this.generatingSummary = true;
    this.summaryEventId    = eventId;

    this.eventService.generateAiSummary(eventId).subscribe({
      next: (updatedEvent: any) => {
        this.events = this.events.map(e =>
          e.id === eventId ? { ...e, aiSummary: updatedEvent.aiSummary } : e
        );
        if (this.detailEvent?.id === eventId) {
          this.detailEvent = { ...this.detailEvent, aiSummary: updatedEvent.aiSummary };
        }
        this.generatingSummary = false;
        this.summaryEventId    = null;
        this.toast('✨ AI Summary generated!');
      },
      error: () => {
        this.toast('❌ Failed to generate summary.', true);
        this.generatingSummary = false;
        this.summaryEventId    = null;
      }
    });
  }

  // ─── Registration ─────────────────────────────────────────────

  registerForEvent(eventId: number): void {
    if (this.registering) return;
    this.registering = true;
    const userId     = this.getCurrentUserId();

    this.eventService.registerToEvent(eventId, userId).subscribe({
      next: () => {
        this.eventService.getEventById(eventId).subscribe({
          next: (updatedEvent: any) => {
            const index = this.events.findIndex(e => e.id === eventId);
            if (index !== -1) {
              this.events[index] = updatedEvent;
              this.events        = [...this.events];
            }
            this.detailEvent = updatedEvent;
            this.registering = false;
            this.toast(`✅ Registered successfully for ${updatedEvent.title?.toUpperCase() ?? 'event'}!`);
          },
          error: () => {
            if (this.detailEvent) {
              const current    = this.detailEvent.currentRegistrations ?? this.detailEvent.registered ?? 0;
              this.detailEvent = { ...this.detailEvent, currentRegistrations: current + 1 };
            }
            this.registering = false;
            this.toast('✅ Registered! (count updated locally)');
          }
        });
      },
      error: (err: any) => {
        this.registering    = false;
        const errorMsg      = err?.error?.message ?? err?.message ?? '';
        if (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('existe')) {
          this.toast('⚠️ You are already registered for this event.', true);
        } else {
          this.toast('❌ Registration failed. Please try again.', true);
        }
      }
    });
  }

  // ─── Speakers ─────────────────────────────────────────────────

  openSpeakersModal(eventId: number): void {
    this.selectedEventIdForSpeakers = eventId;
    this.speakersModalOpen          = true;
  }

  closeSpeakersModal(): void {
    this.speakersModalOpen          = false;
    this.selectedEventIdForSpeakers = null;
  }

  // ─── Toast ────────────────────────────────────────────────────

  private toast(msg: string, isError = false): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg     = msg;
    this.toastError   = isError;
    this.toastVisible = true;
    this.toastTimer   = setTimeout(() => { this.toastVisible = false; }, 3500);
  }

  addEventReview(eventId: number, review: any): void {
    const payload = {
      userId:  this.getCurrentUserId(),
      eventId,
      rating:  review.rating,
      comment: review.comment,
    };
    this.eventReviewService.addReview(payload).subscribe({
      next:  ()    => { this.toast('Review added successfully!'); },
      error: (err) => {
        console.error('Error adding review:', err);
        this.toast('Failed to add review. Please try again.', true);
      }
    });
  }

  // ─── Recommendations ──────────────────────────────────────────
loadRecommendations(): void {
  this.recoLoading = true;

this.eventService.getRecommendations(this.userId).subscribe({
  next: ({ response, body }) => {

    this.recommendations = response.recommendations || [];
    console.log('Received recommendations response:', response);
    console.log('Received recommendations body:', body);

    this.pushNotif(
      `✨ ${body.experience_level} - ${body.preferred_event_types.join(', ')}`
    );
    this.recoLoading = false;
  }
});
}

  startRecoPolling(): void {
    this.recoSub = this.eventService.pollRecommendations(this.userId).subscribe({
      next: (data) => {
        const hadCount       = this.recommendations.length;
        this.recommendations = data;
        if (data.length !== hadCount) {
          this.pushNotif(`🔔 Recommandations mises à jour — ${data.length} événements`);
        }
        const seen = localStorage.getItem('recoSeen');
        if (!seen && data.length && !this.recoPanel) {
          this.recoPanel = true;
          localStorage.setItem('recoSeen', '1');
        }
      }
    });
  }

  pushNotif(msg: string): void {
    this.notifications = [msg, ...this.notifications];
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n !== msg);
    }, 5000);
  }

  scoreColor(score: number): string {
    if (score >= 85) return '#1D9E75';
    if (score >= 70) return '#7F77DD';
    return '#BA7517';
  }

  // ─── QR ───────────────────────────────────────────────────────

  getQrUrl(eventId: number): string {
    return `http://localhost:8081/api/events/${eventId}/qrcode-checkin`;
  }

  openQrModal(event: EventModel): void {
    this.qrEvent       = event;
    this.qrRevealed    = false;
    this.qrImageLoaded = false;
    this.qrCopied      = false;
    this.qrModalOpen   = true;
  }

  closeQrModal(): void {
    this.qrModalOpen = false;
    this.qrEvent     = null;
  }

  revealQr(): void {
    this.qrRevealed    = true;
    this.qrImageLoaded = false;
  }

  downloadQr(event: EventModel): void {
    const a      = document.createElement('a');
    a.href       = this.getQrUrl(event.id!);
    a.download   = `event-${event.id}-qrcode.png`;
    a.click();
  }

  copyEventLink(eventId: number): void {
    navigator.clipboard.writeText(`http://localhost:4200/dashboard/event/${eventId}`);
    this.qrCopied = true;
    setTimeout(() => { this.qrCopied = false; }, 2000);
  }

  nativeShare(event: EventModel): void {
    navigator.share?.({
      title: event.title,
      text:  `Join: ${event.title}`,
      url:   `http://localhost:4200/dashboard/event/${event.id}`
    });
  }
}