import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Assessment, AssessmentRequest, AssessmentResponse } from '../models';

const API_BASE = 'http://localhost:8083/api/v1';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {

  constructor(private http: HttpClient) { }

  /**
   * Get all assessments
   */
  getAllAssessments(): Observable<AssessmentResponse[]> {
    return this.http.get<AssessmentResponse[]>(`${API_BASE}/assessments`);
  }

  /**
   * Get assessment by ID
   */
  getAssessmentById(id: number): Observable<AssessmentResponse> {
    return this.http.get<AssessmentResponse>(`${API_BASE}/assessments/${id}`);
  }

  /**
   * Get assessments by user ID
   */
  getAssessmentsByUserId(userId: number): Observable<AssessmentResponse[]> {
    return this.http.get<AssessmentResponse[]>(`${API_BASE}/assessments/user/${userId}`);
  }

  /**
   * Create a new assessment
   */
  createAssessment(request: AssessmentRequest): Observable<AssessmentResponse> {
    return this.http.post<AssessmentResponse>(`${API_BASE}/assessments`, request);
  }

  /**
   * Update an assessment
   */
  updateAssessment(id: number, request: AssessmentRequest): Observable<AssessmentResponse> {
    return this.http.put<AssessmentResponse>(`${API_BASE}/assessments/${id}`, request);
  }

  /**
   * Update assessment status
   */
  updateAssessmentStatus(id: number, status: string): Observable<AssessmentResponse> {
    return this.http.patch<AssessmentResponse>(`${API_BASE}/assessments/${id}/status`, { status });
  }

  /**
   * Delete an assessment
   */
  deleteAssessment(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/assessments/${id}`);
  }
}
