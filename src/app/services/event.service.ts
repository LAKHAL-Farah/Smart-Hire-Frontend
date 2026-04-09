import { HttpClient } from '@angular/common/http';
import { Injectable, NgModule } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Events } from '@tsparticles/engine';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
apiUrl = 'http://localhost:8081/api/events';
id!: number;

  constructor(private http: HttpClient,ac:ActivatedRoute) {
    ac.paramMap.subscribe(  params => {
      this.id = params.get('id') as unknown as number;
    });
  }

  getEvents(): Observable<any[]> { 
    return this.http.get<any[]>(this.apiUrl);
  }

  addEvent(event: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, event);
  }
  deleteEvent(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  getEventById(id: number) {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  updateEvent(id: number, event: any) {
    return this.http.put(`${this.apiUrl}/${id}`, event);
  }
  registerToEvent(eventId: number, userId: number): Observable<string> {
  return this.http.post(
     `http://localhost:8081/api/events/${eventId}/register/${userId}`,
    null,
    { responseType: 'text' } // ✅ important
  );
}
   


}
