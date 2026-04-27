import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EventQrcodeService } from '../../../../services/event-qrcode.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-event-qrcode',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="qr-wrapper" [class.qr-wrapper--revealed]="revealed">

      <!-- Frosted overlay avant révélation -->
      <div class="qr-veil" *ngIf="!revealed" (click)="reveal()">
        <div class="qr-veil__icon">🔐</div>
        <span class="qr-veil__label">Tap to reveal QR</span>
      </div>

      <!-- QR Code -->
      <div class="qr-frame" *ngIf="revealed">
        <div class="qr-scanner-line"></div>
        <img
          [src]="qrUrl"
          alt="QR Code for event"
          class="qr-image"
          (load)="onLoad()"
          [class.qr-image--loaded]="loaded"
        />
        <!-- Coin décoratifs -->
        <span class="qr-corner qr-corner--tl"></span>
        <span class="qr-corner qr-corner--tr"></span>
        <span class="qr-corner qr-corner--bl"></span>
        <span class="qr-corner qr-corner--br"></span>
      </div>

      <!-- Actions -->
      <div class="qr-actions" *ngIf="revealed">
        <button class="qr-btn qr-btn--download" (click)="download()">
          ⬇ Download
        </button>
        <button class="qr-btn qr-btn--copy" (click)="copyLink()">
          {{ copied ? '✅ Copied!' : '🔗 Copy link' }}
        </button>
      </div>
 
      <!-- ── NOUVEAU : Bouton Scan / confirmation présence ── -->
      <div class="qr-scan-section" *ngIf="revealed">
        <button
          class="qr-btn qr-btn--scan"
          (click)="scanQr()"
          [disabled]="scanning || scanSuccess"
        >
          <span *ngIf="!scanning && !scanSuccess">📷 Confirmer ma présence</span>
          <span *ngIf="scanning">⏳ Vérification...</span>
          <span *ngIf="scanSuccess">✅ Présence confirmée !</span>
        </button>
<!-- Bouton certificat — apparaît après confirmation de présence -->
<div class="qr-scan-section" *ngIf="scanSuccess">
  <button class="qr-btn qr-btn--cert" (click)="downloadCertificate()">
    🎓 Télécharger mon certificat
  </button>
  <p class="qr-scan-code">Code : {{ certificateCode }}</p>
</div>
        <!-- Message d'erreur -->
        <p class="qr-scan-error" *ngIf="scanError">{{ scanError }}</p>
      </div>
      


      
      <p class="qr-hint" *ngIf="revealed">Scan to open event details</p>
    </div>
  
      <p class="qr-hint" *ngIf="revealed">Scan to open event details</p>
  
  `,
  styleUrls: ['./qrcode.component.scss']
})
export class EventQrcodeComponent {
  @Input() eventId!: number;

  revealed = false;
  loaded = false;
  copied = false;
 scanning    = false;
  scanSuccess = false;
  scanError   = '';
  constructor(private qrService: EventQrcodeService, private http: HttpClient) {}

  get qrUrl(): string {
    return this.qrService.getQRCodeUrl(this.eventId);
  }
// Nouvelles propriétés à ajouter
certificateCode = '';
certificateUrl  = '';
  reveal(): void { this.revealed = true; }
  onLoad(): void { this.loaded = true; }

  download(): void {
    const a = document.createElement('a');
    a.href = this.qrUrl;
    a.download = `event-${this.eventId}-qrcode.png`;
    a.click();
  }

  copyLink(): void {
    navigator.clipboard.writeText(`http://localhost:4200/dashboard/event/${this.eventId}`);
    this.copied = true;
    setTimeout(() => this.copied = false, 2000);
  }

scanQr(): void {
  if (this.scanning || this.scanSuccess) return;
  const userId = 100;
  if (!userId) { this.scanError = '❌ Utilisateur non connecté.'; return; }

  this.scanning = true;
  this.scanError = '';

  this.http
    .post<{ message: string; certificateCode: string; certificateUrl: string }>(
      `http://localhost:8081/api/registrations/scan?userId=${userId}&eventId=${this.eventId}`,
      {}
    )
    .subscribe({
      next: (res) => {
        this.scanning        = false;
        this.scanSuccess     = true;
        this.certificateCode = res.certificateCode;
        this.certificateUrl  = res.certificateUrl;
      },
      error: () => {
        this.scanning  = false;
        this.scanError = '❌ Erreur ou utilisateur non inscrit.';
      }
    });
}
downloadCertificate(): void {
  this.http
    .get(`http://localhost:8081/api/registrations/certificate/${this.certificateCode}`,
         { responseType: 'blob' })
    .subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `certificate-${this.certificateCode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
}
}

