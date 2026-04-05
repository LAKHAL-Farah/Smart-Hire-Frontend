import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EventTag } from '../features/back-office/admin/event-management/event-management.component';

@Injectable({
  providedIn: 'root'
})
export class EventTagService {


  apiUrl = 'http://localhost:8081/api/event-tags';
  constructor(private http: HttpClient) { }


  getTagsByEventId(eventId: number) {
    return this.http.get<EventTag[]>(`${this.apiUrl}/${eventId}/tags`);
  }
}