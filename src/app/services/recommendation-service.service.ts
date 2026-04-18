import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, distinctUntilChanged } from 'rxjs';

export interface RecommendationResponseDTO {
  eventId: number;
  score: number;
}

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private apiUrl = 'http://localhost:8081/api/recommendations';

  constructor(private http: HttpClient) {}

  getRecommendations(userId: number): Observable<RecommendationResponseDTO[]> {
    return this.http.post<RecommendationResponseDTO[]>(`${this.apiUrl}/${userId}`, {});
  }

  // Polling toutes les 30s pour simuler le temps réel
  pollRecommendations(userId: number): Observable<RecommendationResponseDTO[]> {
    return interval(30000).pipe(
      switchMap(() => this.getRecommendations(userId))
    );
  }
}