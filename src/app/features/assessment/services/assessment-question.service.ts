import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssessmentQuestion, AssessmentAnswer, AnswerSubmission } from '../models';

const API_BASE = 'http://localhost:8083/api/v1';

@Injectable({
  providedIn: 'root'
})
export class AssessmentQuestionService {

  constructor(private http: HttpClient) { }

  /**
   * Get all assessment questions
   */
  getAllQuestions(): Observable<AssessmentQuestion[]> {
    return this.http.get<AssessmentQuestion[]>(`${API_BASE}/assessment-questions`);
  }

  /**
   * Get question by ID
   */
  getQuestionById(id: number): Observable<AssessmentQuestion> {
    return this.http.get<AssessmentQuestion>(`${API_BASE}/assessment-questions/${id}`);
  }

  /**
   * Get questions by assessment ID
   */
  getQuestionsByAssessmentId(assessmentId: number): Observable<AssessmentQuestion[]> {
    return this.http.get<AssessmentQuestion[]>(`${API_BASE}/assessment-questions/assessment/${assessmentId}`);
  }

  /**
   * Create a new question
   */
  createQuestion(question: AssessmentQuestion): Observable<AssessmentQuestion> {
    return this.http.post<AssessmentQuestion>(`${API_BASE}/assessment-questions`, question);
  }

  /**
   * Update a question
   */
  updateQuestion(id: number, question: AssessmentQuestion): Observable<AssessmentQuestion> {
    return this.http.put<AssessmentQuestion>(`${API_BASE}/assessment-questions/${id}`, question);
  }

  /**
   * Delete a question
   */
  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/assessment-questions/${id}`);
  }

  /**
   * Submit answer
   */
  submitAnswer(answer: AssessmentAnswer): Observable<AssessmentAnswer> {
    return this.http.post<AssessmentAnswer>(`${API_BASE}/assessment-answers`, answer);
  }

  /**
   * Get answer by ID
   */
  getAnswerById(id: number): Observable<AssessmentAnswer> {
    return this.http.get<AssessmentAnswer>(`${API_BASE}/assessment-answers/${id}`);
  }

  /**
   * Get answers by user
   */
  getAnswersByUserId(userId: number): Observable<AssessmentAnswer[]> {
    return this.http.get<AssessmentAnswer[]>(`${API_BASE}/assessment-answers/user/${userId}`);
  }

  /**
   * Get answers by assessment
   */
  getAnswersByAssessmentId(assessmentId: number): Observable<AssessmentAnswer[]> {
    return this.http.get<AssessmentAnswer[]>(`${API_BASE}/assessment-answers/assessment/${assessmentId}`);
  }
}
