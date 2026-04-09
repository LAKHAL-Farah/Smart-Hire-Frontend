import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface EventRegistrationDTO {
  id?: number;
  eventId: number;
  userId: number;
  status?: string;
  registeredAt?: string;
  attended?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EventRegistrationService {

  private apiUrl = 'http://localhost:8081/api/registrations';

  constructor(private http: HttpClient) { }

  // ✅ Récupérer une inscription par ID
  getRegistrationById(id: number): Observable<EventRegistrationDTO> {
    return this.http.get<EventRegistrationDTO>(`${this.apiUrl}/${id}`);
  }

  // ✅ S'inscrire à un événement (avec userId pour test)
  registerToEvent(eventId: number, userId: number): Observable<string> {
    const dto: EventRegistrationDTO = { eventId, userId };
    return this.http.post(this.apiUrl, dto, { responseType: 'text' });
    // responseType: 'text' évite l'erreur JSON
  }

  // ✅ Récupérer toutes les inscriptions
  getAllRegistrations(): Observable<EventRegistrationDTO[]> {
    return this.http.get<EventRegistrationDTO[]>(this.apiUrl);
  }

  // ✅ Récupérer les inscriptions par eventId
  getRegistrationsByEvent(eventId: number): Observable<EventRegistrationDTO[]> {
    return this.http.get<EventRegistrationDTO[]>(`${this.apiUrl}/event/${eventId}`);
  }

  // ✅ Récupérer les inscriptions par userId
  getRegistrationsByUser(userId: number): Observable<EventRegistrationDTO[]> {
    return this.http.get<EventRegistrationDTO[]>(`${this.apiUrl}/user/${userId}`);
  }
}