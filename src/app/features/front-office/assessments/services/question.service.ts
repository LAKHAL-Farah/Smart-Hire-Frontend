import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QuestionRequest {
  content: string;
  type: string; // MCQ | OPEN_ENDED
  difficulty: string; // EASY | MEDIUM | HARD
  skillCategory: string;
  correctAnswer: string;
  answerOptions?: string[]; // For MCQ
  explanation: string;
}

export interface QuestionResponse {
  id: number;
  content: string;
  type: string;
  difficulty: string;
  skillCategory: string;
  answerOptions?: string[];
  explanation: string;
}

const API_BASE = 'http://localhost:8083/api/v1';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {

  constructor(private http: HttpClient) { }

  /**
   * Get all questions
   */
  getAllQuestions(): Observable<QuestionResponse[]> {
    return this.http.get<QuestionResponse[]>(`${API_BASE}/questions`);
  }

  /**
   * Get question by ID
   */
  getQuestionById(id: number): Observable<QuestionResponse> {
    return this.http.get<QuestionResponse>(`${API_BASE}/questions/${id}`);
  }

  /**
   * Get questions by difficulty
   */
  getQuestionsByDifficulty(difficulty: string): Observable<QuestionResponse[]> {
    return this.http.get<QuestionResponse[]>(
      `${API_BASE}/questions/by-difficulty`,
      { params: { difficulty } }
    );
  }

  /**
   * Get questions by skill category
   */
  getQuestionsBySkill(skillCategory: string): Observable<QuestionResponse[]> {
    return this.http.get<QuestionResponse[]>(
      `${API_BASE}/questions/by-skill`,
      { params: { skillCategory } }
    );
  }

  /**
   * Get questions by difficulty and skill
   */
  getQuestionsByDifficultyAndSkill(
    difficulty: string,
    skillCategory: string
  ): Observable<QuestionResponse[]> {
    const params = new HttpParams()
      .set('difficulty', difficulty)
      .set('skillCategory', skillCategory);
    
    return this.http.get<QuestionResponse[]>(
      `${API_BASE}/questions/by-difficulty-and-skill`,
      { params }
    );
  }

  /**
   * Create a new question (Admin)
   */
  createQuestion(request: QuestionRequest): Observable<QuestionResponse> {
    return this.http.post<QuestionResponse>(
      `${API_BASE}/questions`,
      request
    );
  }

  /**
   * Update a question (Admin)
   */
  updateQuestion(id: number, request: QuestionRequest): Observable<QuestionResponse> {
    return this.http.put<QuestionResponse>(
      `${API_BASE}/questions/${id}`,
      request
    );
  }

  /**
   * Delete a question (Admin)
   */
  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/questions/${id}`);
  }
}
