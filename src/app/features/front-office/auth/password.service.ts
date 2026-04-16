import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  resetCode: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordService {
  private base = 'http://localhost:8080/MS-USER/auth';

  constructor(private http: HttpClient) {}

  forgotPassword(payload: ForgotPasswordPayload): Observable<any> {
    return this.http.post(`${this.base}/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<any> {
    return this.http.post(`${this.base}/reset-password`, payload);
  }
}
