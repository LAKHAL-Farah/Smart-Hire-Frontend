import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface EventSpeakerDTO {
  firstName: string;
  lastName: string;
  bio: string;
  expertise: string;
  company: string;
  linkedinUrl: string;
  eventId: number;
}

export interface EventSpeaker {
  id: number;
  firstName: string;
  lastName: string;
  bio: string;
  expertise: string;
  company: string;
  linkedinUrl: string;
  photoUrl: string;
}

@Injectable({ providedIn: 'root' })
export class EventSpeakerService {
  private base = 'http://localhost:8081/api/speakers';

  constructor(private http: HttpClient) {}

  getAll(): Observable<EventSpeaker[]> {
    return this.http.get<EventSpeaker[]>(this.base);
  }

  getById(id: number): Observable<EventSpeaker> {
    return this.http.get<EventSpeaker>(`${this.base}/${id}`);
  }

  add(dto: EventSpeakerDTO): Observable<EventSpeaker> {
    return this.http.post<EventSpeaker>(this.base, dto);
    
  }

  update(id: number, dto: EventSpeakerDTO): Observable<EventSpeaker> {
    return this.http.put<EventSpeaker>(`${this.base}/${id}`, dto);
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.base}/${id}`, { responseType: 'text' });
  }
}