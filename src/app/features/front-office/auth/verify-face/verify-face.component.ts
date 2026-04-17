import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthMfaService } from '../auth-mfa.service';
import { AuthLeftPanelComponent } from '../auth-left-panel/auth-left-panel.component';
import { AutheService } from '../authe.service';

@Component({
  selector: 'app-verify-face',
  standalone: true,
  imports: [CommonModule, AuthLeftPanelComponent],
  templateUrl: './verify-face.component.html',
  styleUrls: ['./verify-face.component.scss']
})
export class VerifyFaceComponent implements OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  faceImagePreview = '';
  faceImageBase64 = '';
  token = '';
  loading = false;
  verificationResult: any = null;
  attemptsRemaining = 3;
  stream: MediaStream | null = null;

  constructor(private auth: AuthMfaService, private route: ActivatedRoute, private router: Router, private authService: AutheService) {
    this.route.queryParams.subscribe((q) => {
      this.token = q['token'] || sessionStorage.getItem('faceVerificationToken') || '';
      console.log('Received face verification token:', this.token);
    });
    // start camera automatically
    void this.startCamera();
  }

  async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (this.videoRef?.nativeElement) {
        this.videoRef.nativeElement.srcObject = this.stream;
        await this.videoRef.nativeElement.play();
      }
    } catch (err) {
      // ignore: user may upload image instead
    }
  }

  captureFace(): void {
    const video = this.videoRef?.nativeElement;
    if (!video) return;
    const data = this.auth.captureWebcamImage(video);
    this.faceImagePreview = data;
    this.faceImageBase64 = data;
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.auth.convertImageToBase64(file).then((b) => {
      this.faceImagePreview = b;
      this.faceImageBase64 = b;
    });
  }

  verifyFace(): void {
    if (!this.faceImageBase64 || !this.token) return;
    this.loading = true;
    this.auth.verifyFace(this.token, this.faceImageBase64).subscribe({
      next: (res) => {
        this.loading = false;
        console.log('Face verification result:', res);
        this.verificationResult = res;
        if (res?.status === 'SUCCESS') {
          localStorage.setItem('auth_token', res.data.token);
          localStorage.setItem('userId', res.data.userId);
          localStorage.setItem('userName', res.data.userName);
          localStorage.setItem('email', res.data.email);
          localStorage.setItem('role', res.data.roles);
          this.authService.redirectAfterLogin();
        }
      },
      error: (err) => {
        this.loading = false;
        this.verificationResult = err?.error || { matches: false };
        this.attemptsRemaining = err?.error?.details?.attemptRemaining ?? (this.attemptsRemaining - 1);
        if (this.attemptsRemaining <= 0) {
          void this.router.navigate(['/login']);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
    }
  }
}
