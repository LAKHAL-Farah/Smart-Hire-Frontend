import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Skill } from '../models';

const API_BASE = 'http://localhost:8083/api/v1';

@Injectable({
  providedIn: 'root'
})
export class SkillService {

  constructor(private http: HttpClient) { }

  /**
   * Get all skills
   */
  getAllSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${API_BASE}/skills`);
  }

  /**
   * Get skill by ID
   */
  getSkillById(id: number): Observable<Skill> {
    return this.http.get<Skill>(`${API_BASE}/skills/${id}`);
  }

  /**
   * Get skills by category
   */
  getSkillsByCategory(category: string): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${API_BASE}/skills/category/${category}`);
  }

  /**
   * Create a new skill
   */
  createSkill(skill: Skill): Observable<Skill> {
    return this.http.post<Skill>(`${API_BASE}/skills`, skill);
  }

  /**
   * Update a skill
   */
  updateSkill(id: number, skill: Skill): Observable<Skill> {
    return this.http.put<Skill>(`${API_BASE}/skills/${id}`, skill);
  }

  /**
   * Delete a skill
   */
  deleteSkill(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/skills/${id}`);
  }
}
