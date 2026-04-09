import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../../services/event.service';

// Types locaux
export type EventType = 'Conference' | 'Workshop' | 'Networking' | 'Webinar' | 'Hackathon';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface EventModel {
  id?: number;
  title: string;
  type: EventType;
  status: EventStatus;
  date: string;
  time?: string;
  location?: string;
  capacity?: number;
  registered?: number;
  registeredUsers?: number[];
  description?: string;
  organizer?: string;
  currentRegistrations?: number;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {
  events: EventModel[] = [];
  loading = false;
  error = '';

  search = '';
  activeFilter = 'all';
  filterTabs = [
    { key: 'all', label: 'All events' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
    { key: 'Workshop', label: 'Workshops' },
    { key: 'Conference', label: 'Conferences' },
  ];

  eventTypes: EventType[] = ['Conference', 'Workshop', 'Networking', 'Webinar', 'Hackathon'];
  eventStatuses: EventStatus[] = ['upcoming', 'ongoing', 'completed', 'cancelled'];

  private typeColorMap: Record<string, string> = {
    Conference: '#4f9eff',
    Workshop: '#34d399',
    Networking: '#f59e0b',
    Webinar: '#a78bfa',
    Hackathon: '#f472b6',
    default: '#94a3b8'
  };

  modalOpen = false;
  editId: number | null = null;
  saving = false;
  form: EventModel = this.emptyForm();

  deleteTarget: EventModel | null = null;
  deleting = false;

  detailModalOpen = false;
  detailLoading = false;
  detailEvent: EventModel | null = null;

  toastMsg = '';
  toastError = false;
  toastVisible = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.fetchEvents();
  }

  fetchEvents(): void {
    this.loading = true;
    this.error = '';
    this.eventService.getEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.loading = false;
        console.log('Events loaded:', this.events);
      },
      error: () => {
        this.error = 'Failed to load events.';
        this.loading = false;
      }
    });
  }
get Events():EventModel[] {
  return this.eventService.getEvents() as unknown as EventModel[];
  console.log(this.eventService.getEvents());
}

  get filteredEvents(): EventModel[] {
    const q = this.search.toLowerCase();
    return this.events.filter(e => {
      const matchSearch = !q
        || e.title.toLowerCase().includes(q)
        || (e.location?.toLowerCase().includes(q) ?? false);
      const matchTab = this.activeFilter === 'all'
        || e.status === this.activeFilter
        || e.type === this.activeFilter;
      return matchSearch && matchTab;
    });
  }

 get stats() {
  const total = this.events.length;

  // Adapter le filtrage selon les status réels de tes événements
  const upcoming = this.events.filter(e => e.status === 'upcoming').length;
  const completed = this.events.filter(e => e.status === 'completed').length;

  // Somme des inscriptions actuelles
  const totalReg = this.events.reduce((sum, e) => sum + (e.currentRegistrations ?? 0), 0);

  return [
    { value: total, label: 'Total Events' },
    { value: upcoming, label: 'Upcoming' },
    { value: completed, label: 'Completed' },
    { value: totalReg.toLocaleString(), label: 'Total Registrations' }
  ];
}

  typeColor(type: string | undefined): string {
    return this.typeColorMap[type ?? 'default'] ?? this.typeColorMap['default'];
  }

  pct(registered = 0, capacity = 1): number {
    return Math.min(100, Math.round((registered / capacity) * 100));
  }

  emptyForm(): EventModel {
    return {
      title: '',
      type: 'Conference',
      status: 'upcoming',
      date: '',
      time: '09:00',
      location: '',
      capacity: 50,
      registered: 0,
      description: ''
    };
  }

  openModal(event?: EventModel): void {
    this.form = event ? { ...event } : this.emptyForm();
    this.editId = event?.id ?? null;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editId = null;
    this.saving = false;
  }

  save(): void {
    if (!this.form.title?.trim()) { this.toast('Title is required.', true); return; }
    if (!this.form.date) { this.toast('Date is required.', true); return; }

    this.saving = true;
    const request$ = this.editId
      ? this.eventService.updateEvent(this.editId, this.form)
      : this.eventService.addEvent(this.form);

    request$.subscribe({
      next: (saved: any) => {
        if (this.editId) {
          this.events = this.events.map(e => e.id === this.editId ? { ...e, ...saved } : e);
          this.toast('Event updated.');
        } else {
          this.events = [saved, ...this.events];
          this.toast('Event created.');
        }
        this.closeModal();
      },
      error: () => {
        this.toast('Error while saving.', true);
        this.saving = false;
      }
    });
  }

  confirmDelete(event: EventModel): void {
    this.deleteTarget = event;
  }

  doDelete(): void {
    if (!this.deleteTarget?.id) return;
    this.deleting = true;
    this.eventService.deleteEvent(this.deleteTarget.id).subscribe({
      next: () => {
        this.events = this.events.filter(e => e.id !== this.deleteTarget!.id);
        this.toast('Event deleted.');
        this.deleteTarget = null;
        this.deleting = false;
      },
      error: () => {
        this.toast('Delete failed.', true);
        this.deleting = false;
      }
    });
  }

  openDetailModal(id: number): void {
    this.detailModalOpen = true;
    this.detailLoading = true;
    this.eventService.getEventById(id).subscribe({
      next: (event: any) => {
        this.detailEvent = event;
        this.detailLoading = false;
      },
      error: () => {
        this.toast('Error loading details', true);
        this.detailLoading = false;
        this.closeDetailModal();
      }
    });
  }

  closeDetailModal(): void {
    this.detailModalOpen = false;
    this.detailEvent = null;
    this.detailLoading = false;
  }

  private getCurrentUserId(): number {
    // ⚠️ À remplacer par un vrai système d'authentification
    return Date.now();
  }

  registerForEvent(eventId: number): void {
    const userId = this.getCurrentUserId();

    this.eventService.registerToEvent(eventId, userId).subscribe({
      next: (response: any) => {
        this.toast('✅ Registered successfully!');
        this.closeDetailModal();
        this.eventService.getEventById(eventId).subscribe({
          next: (updatedEvent: any) => {
            const index = this.events.findIndex(e => e.id === eventId);
            if (index !== -1) {
              this.events[index] = updatedEvent;
              this.events = [...this.events];
            }
            this.toast(`Registration successful! For ${updatedEvent.title?.toUpperCase()}`, false);
          },
          error: () => {
            const event = this.events.find(e => e.id === eventId);
            if (event) {
              event.registered = (event.registered ?? 0) + 1;
            }
            this.toast('Registration count updated locally.');
          }
        });
      },
      error: (err: any) => {
        const errorMsg = err.error?.message || err.message || 'Registration failed.';
        if (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('existe')) {
          this.toast('⚠️ You are already registered for this event.', true);
        } else {
          this.toast('❌ Registration failed. Please try again.', true);
        }
        console.error('Registration error:', err);
      }
    });
  }

  private toast(msg: string, isError = false): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg = msg;
    this.toastError = isError;
    this.toastVisible = true;
    this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 3000);
  }
}