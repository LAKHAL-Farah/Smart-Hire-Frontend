import { HttpClient } from '@angular/common/http';
import { Injectable, ApplicationConfig } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventReviewService {
apiUrl = ' http://localhost:8081/api/reviews';
  constructor(private http:HttpClient) { }

  getReviews(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  addReview(review: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, review);
  }
  deleteReview(id: number) {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
  updateReview(id: number, review: any) {
    return this.http.put(`${this.apiUrl}/update/${id}`, review);
  }

  getReviewByEventId(eventId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/events/${eventId}`);
  }

}
