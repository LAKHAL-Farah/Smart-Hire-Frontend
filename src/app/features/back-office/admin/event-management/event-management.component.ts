import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventService } from '../../../../services/event.service';
import { LucideAngularModule } from 'lucide-angular';

interface Event {
  id: number;
  title: string;
  description: string;
  type: 'CONFERENCE' | 'HACKATHON' | 'WORKSHOP' | 'MEETUP' | string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | string;
  location: string;
  online: boolean;
  onlineUrl?: string;
  domain: string;
  startDate: string; // ISO string depuis le backend
  endDate: string;
  maxCapacity: number;
  currentRegistrations: number;
  organizerId: number;
  aiSummary?: string;
  createdAt: string;
  tags?: { id: number; name: string }[];
  speakers?: any[];
  registrations?: any[];
  reviews?: any[];
  submissions?: any[];
}

@Component({
  selector: 'app-event-management',
  standalone: true,
  imports: [CommonModule,LucideAngularModule],
  templateUrl: './event-management.component.html'
})
export class EventManagementComponent implements OnInit {
  events: any[] = [];

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.eventService.getEvents().subscribe(data => {
      console.log(data);
      this.events = data;
    });
  }
  openMenuId: number | null = null;

toggleMenu(id: number) {
  this.openMenuId = this.openMenuId === id ? null : id;
}
newEvent: Event = {
  id: 0,
  title: '',
  description: '',
  type: 'CONFERENCE',
  status: 'UPCOMING',
  location: '',
  online: false,
  onlineUrl: '',
  domain: '',
  startDate: '',
  endDate: '',
  maxCapacity: 0,
  currentRegistrations: 0,
  organizerId: 1,
  createdAt: '',
};

addEvent() {
  this.eventService.addEvent(this.newEvent).subscribe({
    next: (res) => {
      console.log('Event ajouté', res);
      this.events.push(res); // mise à jour instantanée
      this.resetForm();
    },
    error: (err) => {
      console.error('Erreur ajout', err);
    }
  });
}

resetForm() {
  this.newEvent = {
    id: 0,
    title: '',
    description: '',
    type: 'CONFERENCE',
    status: 'UPCOMING',
    location: '',
    online: false,
    onlineUrl: '',
    domain: '',
    startDate: '',
    endDate: '',
    maxCapacity: 0,
    currentRegistrations: 0,
    organizerId: 1,
    createdAt: '',
  };
}

  

}