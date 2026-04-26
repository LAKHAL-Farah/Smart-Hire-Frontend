import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, interval, map, startWith, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private apiUrl = 'http://localhost:8081/api/events';
  private recoUrl = 'http://localhost:8000';

  private id!: number;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    this.route.paramMap.subscribe(params => {
      const value = params.get('id');
      this.id = value ? +value : 0;
    });
  }

  // ─────────────────────────────
  // EVENTS (Spring API)
  // ─────────────────────────────

  getEvents(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getEventById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  addEvent(event: any): Observable<any> {
    return this.http.post(this.apiUrl, event);
  }

  updateEvent(id: number, event: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  registerToEvent(eventId: number, userId: number): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/${eventId}/register/${userId}`,
      null,
      { responseType: 'text' }
    );
  }

  generateAiSummary(eventId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${eventId}/ai-summary`, {});
  }

  // ─────────────────────────────
  // FASTAPI RECOMMENDATIONS
  // ─────────────────────────────

getRecommendations(userId: number): Observable<any> {

  const body = {
    user_id: userId,
    skills: ['Python', 'Machine Learning'],
    interests: ['AI'],
    experience_level: 'intermediate',
    preferred_event_types: ['HACKATHON']
  };

  return this.http.post(`${this.recoUrl}/recommendations?top_k=5`, body)
    .pipe(
      map(res => ({
        response: res,
        body: body   // 👈 on renvoie aussi le body
      }))
    );
}



  pollRecommendations(userId: number): Observable<any> {
    return interval(60000).pipe(
      startWith(0),
      switchMap(() => this.getRecommendations(userId))
    );
  }

  // ─────────────────────────────
  // USER PROFILE (FASTAPI FORMAT)
  // ─────────────────────────────

 
}