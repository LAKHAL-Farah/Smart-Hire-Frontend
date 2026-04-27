import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventQrcodeService {
  private base = 'http://localhost:8081/api/events';

  constructor(private http: HttpClient) {}

  getQRCodeUrl(eventId: number): string {
    return `${this.base}/${eventId}/qrcode`;
  }

  getQRCodeBlob(eventId: number): Observable<Blob> {
    return this.http.get(`${this.base}/${eventId}/qrcode`, { responseType: 'blob' });
  }
  
}