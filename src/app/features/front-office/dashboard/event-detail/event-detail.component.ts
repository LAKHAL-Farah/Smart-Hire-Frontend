import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventModel } from '../events/events.component';
import { EventService } from '../../../../services/event.service';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss']
})
export class EventDetailsPageComponent implements OnInit {
  event: EventModel | null = null;
  loading = false;
  error = '';
  registering = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEvent(+id);
    } else {
      this.error = 'Aucun identifiant d\'événement fourni.';
    }
  }

  loadEvent(id: number): void {
    this.loading = true;
    this.eventService.getEventById(id).subscribe({
      next: (data: any) => {
        this.event = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger l\'événement.';
        this.loading = false;
      }
    });
  }

  register(): void {
    if (!this.event?.id) return;
    this.registering = true;
    const userId = Date.now();
    this.eventService.registerToEvent(this.event.id, userId).subscribe({
      next: () => {
        this.registering = false;
        this.loadEvent(this.event!.id!);
      },
      error: () => {
        this.registering = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }

  get isFull(): boolean {
    if (!this.event) return false;
    const registered = this.event.currentRegistrations ?? this.event.registered ?? 0;
    return registered >= (this.event.capacity ?? Infinity);
  }

  get fillPercent(): number {
    if (!this.event?.capacity) return 0;
    const registered = this.event.currentRegistrations ?? this.event.registered ?? 0;
    return Math.min(100, Math.round((registered / this.event.capacity) * 100));
  }

  get spotsLeft(): number {
    if (!this.event?.capacity) return 0;
    const registered = this.event.currentRegistrations ?? this.event.registered ?? 0;
    return Math.max(0, this.event.capacity - registered);
  }

  get registeredCount(): number {
    if (!this.event) return 0;
    return this.event.currentRegistrations ?? this.event.registered ?? 0;
  }

  get organizerInitials(): string {
    if (!this.event?.organizer) return '?';
    return this.event.organizer
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  typeColor(type: string): string {
    const map: Record<string, string> = {
      Conference: '#4f9eff',
      Workshop: '#34d399',
      Networking: '#f59e0b',
      Webinar: '#a78bfa',
      Hackathon: '#f472b6'
    };
    return map[type] || '#94a3b8';
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      upcoming: 'status-badge--upcoming',
      ongoing: 'status-badge--ongoing',
      completed: 'status-badge--completed',
      cancelled: 'status-badge--cancelled'
    };
    return map[status?.toLowerCase()] || 'status-badge--upcoming';
  }

  googleCalendarUrl(): string {
    if (!this.event) return '#';
    const title = encodeURIComponent(this.event.title ?? '');
    const details = encodeURIComponent(this.event.description ?? '');
    const location = encodeURIComponent(this.event.location ?? '');
    const start = this.event.startDate
      ? new Date(this.event.startDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      : '';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${start}/${start}`;
  }

  typeIconBg(type: string): string {
    const map: Record<string, string> = {
      Conference: 'meta-item__icon--blue',
      Workshop: 'meta-item__icon--green',
      Networking: 'meta-item__icon--gold',
      Webinar: 'meta-item__icon--purple',
      Hackathon: 'meta-item__icon--pink'
    };
    return map[type] || 'meta-item__icon--blue';
  }
}