import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HackathonSubmissionService {

  constructor(private http: HttpClient) { }
  apiUrl = 'http://localhost:8081/api/submissions';


  getSubmissions() {
    return this.http.get<any[]>(this.apiUrl);
  }


  addSubmission(submission: any) {
    return this.http.post<any>(`${this.apiUrl}`, submission);
  }
  deleteSubmission(id: number) {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
  getSubmissionById(id: number) {
    return this.http.get(`${this.apiUrl}/${id}`);
  }
  updateSubmission(id: number, submission: any) {
    return this.http.put(`${this.apiUrl}/update/${id}`, submission);
  }
  getByEventId(eventId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/event/${eventId}`);
  }


}
