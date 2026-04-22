import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  AtsScoreDto,
  CandidateCvDto,
  CreateJobOfferRequest,
  CvVersionDto,
  JobOfferDto,
} from '../models/profile-optimizer.models';

export const PROFILE_OPTIMIZER_USER_ID = '00000000-0000-0000-0000-000000000001';

@Injectable({
  providedIn: 'root',
})
export class ProfileOptimizerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8092';

  // ─── CV ───────────────────────────────────────────

  /** Endpoint: POST http://localhost:8092/api/cv/upload */
  uploadCv(file: File, userId: string = PROFILE_OPTIMIZER_USER_ID): Observable<CandidateCvDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    return this.http.post<CandidateCvDto>(`${this.baseUrl}/api/cv/upload`, formData).pipe(
      catchError(() => this.toUserError('Unable to upload CV right now. Please try again.'))
    );
  }

  /** Endpoint: GET http://localhost:8092/api/cv */
  listCvs(): Observable<CandidateCvDto[]> {
    return this.http.get<CandidateCvDto[]>(`${this.baseUrl}/api/cv`).pipe(
      catchError(() => this.toUserError('Unable to load CVs right now.'))
    );
  }

  /** Endpoint: GET http://localhost:8092/api/cv/{cvId} */
  getCvById(cvId: string): Observable<CandidateCvDto> {
    return this.http.get<CandidateCvDto>(`${this.baseUrl}/api/cv/${encodeURIComponent(cvId)}`).pipe(
      catchError(() => this.toUserError('Unable to load the selected CV.'))
    );
  }

  /** Endpoint: GET http://localhost:8092/api/cv/{cvId}/score */
  getCvScore(cvId: string): Observable<AtsScoreDto> {
    return this.http.get<AtsScoreDto>(`${this.baseUrl}/api/cv/${encodeURIComponent(cvId)}/score`).pipe(
      catchError(() => this.toUserError('Unable to compute ATS score for this CV.'))
    );
  }

  /** Endpoint: POST http://localhost:8092/api/cv/{cvId}/tailor */
  tailorCv(cvId: string, jobOfferId: string): Observable<CvVersionDto> {
    return this.http
      .post<CvVersionDto>(`${this.baseUrl}/api/cv/${encodeURIComponent(cvId)}/tailor`, {
        jobOfferId,
      })
      .pipe(catchError(() => this.toUserError('Unable to tailor CV right now. Please try again.')));
  }

  /** Endpoint: GET http://localhost:8092/api/cv/{cvId}/versions */
  getCvVersions(cvId: string): Observable<CvVersionDto[]> {
    return this.http.get<CvVersionDto[]>(`${this.baseUrl}/api/cv/${encodeURIComponent(cvId)}/versions`).pipe(
      catchError(() => this.toUserError('Unable to load CV versions right now.'))
    );
  }

  /** Endpoint: GET http://localhost:8092/api/cv/versions/{versionId} */
  getCvVersionById(versionId: string): Observable<CvVersionDto> {
    return this.http
      .get<CvVersionDto>(`${this.baseUrl}/api/cv/versions/${encodeURIComponent(versionId)}`)
      .pipe(catchError(() => this.toUserError('Unable to load this CV version.')));
  }

  /** Endpoint: GET http://localhost:8092/api/cv/versions/{versionId}/export */
  exportCvVersionPdf(versionId: string): Observable<Blob> {
    return this.http
      .get(`${this.baseUrl}/api/cv/versions/${encodeURIComponent(versionId)}/export`, {
        responseType: 'blob',
      })
      .pipe(catchError(() => this.toUserError('Unable to export PDF right now.')));
  }

  /** Endpoint: DELETE http://localhost:8092/api/cv/{cvId} */
  deleteCv(cvId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/cv/${encodeURIComponent(cvId)}`).pipe(
      catchError(() => this.toUserError('Unable to delete this CV right now.'))
    );
  }

  // ─── JOB OFFERS ───────────────────────────────────

  /** Endpoint: POST http://localhost:8092/api/job-offers */
  createJobOffer(body: CreateJobOfferRequest, userId: string = PROFILE_OPTIMIZER_USER_ID): Observable<JobOfferDto> {
    return this.http.post<JobOfferDto>(`${this.baseUrl}/api/job-offers`, body).pipe(
      catchError(() => this.toUserError('Unable to save this job offer right now.'))
    );
  }

  /** Endpoint: GET http://localhost:8092/api/job-offers */
  listJobOffers(): Observable<JobOfferDto[]> {
    return this.http.get<JobOfferDto[]>(`${this.baseUrl}/api/job-offers`).pipe(
      catchError(() => this.toUserError('Unable to load job offers right now.'))
    );
  }

  /** Endpoint: GET http://localhost:8092/api/job-offers/{id} */
  getJobOfferById(id: string): Observable<JobOfferDto> {
    return this.http.get<JobOfferDto>(`${this.baseUrl}/api/job-offers/${encodeURIComponent(id)}`).pipe(
      catchError(() => this.toUserError('Unable to load this job offer.'))
    );
  }

  /** Endpoint: DELETE http://localhost:8092/api/job-offers/{id} */
  deleteJobOffer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/job-offers/${encodeURIComponent(id)}`).pipe(
      catchError(() => this.toUserError('Unable to delete this job offer right now.'))
    );
  }

  private toUserError(message: string): Observable<never> {
    return throwError(() => new Error(message));
  }
}
