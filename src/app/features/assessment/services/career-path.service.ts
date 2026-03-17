import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CareerPath } from '../models';

const API_BASE = 'http://localhost:8083/api/v1';

@Injectable({
  providedIn: 'root'
})
export class CareerPathService {

  constructor(private http: HttpClient) { }

  /**
   * Get all career paths
   */
  getAllCareerPaths(): Observable<CareerPath[]> {
    return this.http.get<CareerPath[]>(`${API_BASE}/career-paths`);
  }

  /**
   * Get career path by ID
   */
  getCareerPathById(id: number): Observable<CareerPath> {
    return this.http.get<CareerPath>(`${API_BASE}/career-paths/${id}`);
  }

  /**
   * Create a new career path
   */
  createCareerPath(careerPath: CareerPath): Observable<CareerPath> {
    return this.http.post<CareerPath>(`${API_BASE}/career-paths`, careerPath);
  }

  /**
   * Update a career path
   */
  updateCareerPath(id: number, careerPath: CareerPath): Observable<CareerPath> {
    return this.http.put<CareerPath>(`${API_BASE}/career-paths/${id}`, careerPath);
  }

  /**
   * Delete a career path
   */
  deleteCareerPath(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/career-paths/${id}`);
  }
}
