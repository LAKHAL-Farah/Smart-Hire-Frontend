import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthMfaService {
  // Use environment.userApiUrl (dev points to port 8082)
  private baseUrl = 'http://localhost:8080/MS-USER';

  constructor(private http: HttpClient) {}

  loginMfa(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login-mfa`, { email, password });
  }

  verifyFace(tempToken: string, image: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/verify-face`, { tempToken, image });
  }

  enableFaceRecognition(faceImageBase64: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/enable-face-recognition`, { faceImage: faceImageBase64 });
  }

  disableFaceRecognition(): Observable<any> {
    return this.http.put(`${this.baseUrl}/auth/disable-face-recognition`, {});
  }

  convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  captureWebcamImage(video: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  }
}
