import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = 'http://localhost:8083/api/v1';

export interface Skill {
  id?: number;
  name: string;
  category: string;
  description?: string;
  createdAt?: string;
}

export interface Assessment {
  id?: number;
  userId: number;
  type: string;
  status?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface CareerPath {
  id?: number;
  name: string;
  description?: string;
  requiredSkills?: string;
  targetRoles?: string;
  averageSalary: number;
}

export interface AssessmentQuestion {
  id?: number;
  assessmentId: number;
  questionText: string;
  category: string;
  difficulty: number;
}

export interface AssessmentAnswer {
  id?: number;
  assessmentQuestionId: number;
  userId: number;
  answerText: string;
  score: number;
}

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {

  constructor(private http: HttpClient) { }

  // Skills Endpoints
  getAllSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${API_BASE}/skills`);
  }

  getSkillById(id: number): Observable<Skill> {
    return this.http.get<Skill>(`${API_BASE}/skills/${id}`);
  }

  getSkillsByCategory(category: string): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${API_BASE}/skills/category/${category}`);
  }

  createSkill(skill: Skill): Observable<Skill> {
    return this.http.post<Skill>(`${API_BASE}/skills`, skill);
  }

  updateSkill(id: number, skill: Skill): Observable<Skill> {
    return this.http.put<Skill>(`${API_BASE}/skills/${id}`, skill);
  }

  deleteSkill(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/skills/${id}`);
  }

  // Assessments Endpoints
  getAllAssessments(): Observable<Assessment[]> {
    return this.http.get<Assessment[]>(`${API_BASE}/assessments`);
  }

  getAssessmentById(id: number): Observable<Assessment> {
    return this.http.get<Assessment>(`${API_BASE}/assessments/${id}`);
  }

  getAssessmentsByUserId(userId: number): Observable<Assessment[]> {
    return this.http.get<Assessment[]>(`${API_BASE}/assessments/user/${userId}`);
  }

  createAssessment(assessment: Assessment): Observable<Assessment> {
    return this.http.post<Assessment>(`${API_BASE}/assessments`, assessment);
  }

  updateAssessment(id: number, assessment: Assessment): Observable<Assessment> {
    return this.http.put<Assessment>(`${API_BASE}/assessments/${id}`, assessment);
  }

  updateAssessmentStatus(id: number, status: string): Observable<Assessment> {
    return this.http.patch<Assessment>(`${API_BASE}/assessments/${id}/status?status=${status}`, {});
  }

  deleteAssessment(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/assessments/${id}`);
  }

  // Career Paths Endpoints
  getAllCareerPaths(): Observable<CareerPath[]> {
    return this.http.get<CareerPath[]>(`${API_BASE}/career-paths`);
  }

  getCareerPathById(id: number): Observable<CareerPath> {
    return this.http.get<CareerPath>(`${API_BASE}/career-paths/${id}`);
  }

  createCareerPath(careerPath: CareerPath): Observable<CareerPath> {
    return this.http.post<CareerPath>(`${API_BASE}/career-paths`, careerPath);
  }

  updateCareerPath(id: number, careerPath: CareerPath): Observable<CareerPath> {
    return this.http.put<CareerPath>(`${API_BASE}/career-paths/${id}`, careerPath);
  }

  deleteCareerPath(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/career-paths/${id}`);
  }

  // Assessment Questions Endpoints
  getAllAssessmentQuestions(): Observable<AssessmentQuestion[]> {
    return this.http.get<AssessmentQuestion[]>(`${API_BASE}/assessment-questions`);
  }

  getAssessmentQuestionById(id: number): Observable<AssessmentQuestion> {
    return this.http.get<AssessmentQuestion>(`${API_BASE}/assessment-questions/${id}`);
  }

  getAssessmentQuestionsByAssessmentId(assessmentId: number): Observable<AssessmentQuestion[]> {
    return this.http.get<AssessmentQuestion[]>(`${API_BASE}/assessment-questions/assessment/${assessmentId}`);
  }

  createAssessmentQuestion(question: AssessmentQuestion): Observable<AssessmentQuestion> {
    return this.http.post<AssessmentQuestion>(`${API_BASE}/assessment-questions`, question);
  }

  updateAssessmentQuestion(id: number, question: AssessmentQuestion): Observable<AssessmentQuestion> {
    return this.http.put<AssessmentQuestion>(`${API_BASE}/assessment-questions/${id}`, question);
  }

  deleteAssessmentQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/assessment-questions/${id}`);
  }

  // Assessment Answers Endpoints
  getAllAssessmentAnswers(): Observable<AssessmentAnswer[]> {
    return this.http.get<AssessmentAnswer[]>(`${API_BASE}/assessment-answers`);
  }

  getAssessmentAnswerById(id: number): Observable<AssessmentAnswer> {
    return this.http.get<AssessmentAnswer>(`${API_BASE}/assessment-answers/${id}`);
  }

  getAssessmentAnswersByQuestionId(questionId: number): Observable<AssessmentAnswer[]> {
    return this.http.get<AssessmentAnswer[]>(`${API_BASE}/assessment-answers/question/${questionId}`);
  }

  getAssessmentAnswersByUserId(userId: number): Observable<AssessmentAnswer[]> {
    return this.http.get<AssessmentAnswer[]>(`${API_BASE}/assessment-answers/user/${userId}`);
  }

  createAssessmentAnswer(answer: AssessmentAnswer): Observable<AssessmentAnswer> {
    return this.http.post<AssessmentAnswer>(`${API_BASE}/assessment-answers`, answer);
  }

  updateAssessmentAnswer(id: number, answer: AssessmentAnswer): Observable<AssessmentAnswer> {
    return this.http.put<AssessmentAnswer>(`${API_BASE}/assessment-answers/${id}`, answer);
  }

  deleteAssessmentAnswer(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/assessment-answers/${id}`);
  }
}
