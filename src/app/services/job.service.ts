import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Job {
  id: number;
  title: string;
  company: string;
  companyInitials: string;
  companyColor: string;
  verified: boolean;
  locationType: string;
  contractType: string;
  salaryRange: string;
  experienceLevel: string;
  skills: string[];
  matchScore: number;
  postedDate: string;
  description: string;
  saved: boolean;
}

export interface JobCreateDto {
  title: string;
  company: string;
  locationType: string;
  contractType: string;
  experienceLevel: string;
  description: string;

  companyInitials?: string;
  companyColor?: string;
  verified?: boolean;
  salaryRange?: string;
  skills?: string[];
  userId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class JobService {

  private apiUrl = 'http://localhost:8085/api/jobs';

  constructor(private http: HttpClient) {}

  getJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(this.apiUrl);
  }

  createJob(payload: JobCreateDto): Observable<Job> {
    return this.http.post<Job>(this.apiUrl, payload);
  }
}