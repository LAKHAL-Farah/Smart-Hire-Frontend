import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { LiveSessionService } from '../services/live-session.service';
import { LiveSubMode } from '../models/live-session.model';
import { resolveCurrentUserId } from '../../features/front-office/dashboard/interview/interview-user.util';

@Component({
  selector: 'app-live-start',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule],
  templateUrl: './live-start.component.html',
  styleUrl: './live-start.component.scss',
})
export class LiveStartComponent implements OnInit, OnDestroy {
  @ViewChild('previewVideo') previewVideo?: ElementRef<HTMLVideoElement>;

  questionCount = 5;
  liveSubMode: LiveSubMode = 'PRACTICE_LIVE';
  companyName = '';
  targetRole = '';
  isLoading = false;
  permissionsGranted = false;
  cameraPreviewStream: MediaStream | null = null;
  errorMessage: string | null = null;

  private readonly currentUser = resolveCurrentUserId();

  constructor(
    private readonly liveService: LiveSessionService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.applyCypressPermissionOverride()) {
      return;
    }
    this.requestPermissions();
  }

  ngOnDestroy(): void {
    this.cameraPreviewStream?.getTracks().forEach((track) => track.stop());
    this.cameraPreviewStream = null;
  }

  setSubMode(mode: LiveSubMode): void {
    this.liveSubMode = mode;
  }

  onQuestionCountInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.questionCount = Number.isFinite(value) ? Math.min(15, Math.max(3, value)) : 5;
  }

  onStart(): void {
    if (!this.permissionsGranted) {
      this.errorMessage = 'Please allow camera and microphone access.';
      return;
    }

    this.errorMessage = null;
    this.isLoading = true;

    this.liveService
      .startLiveSession({
        userId: this.currentUser,
        careerPathId: 1,
        liveSubMode: this.liveSubMode,
        questionCount: this.questionCount,
        companyName: this.companyName.trim() || undefined,
        targetRole: this.targetRole.trim() || undefined,
      })
      .subscribe({
        next: (session) => {
          this.isLoading = false;
          this.router.navigate(['/interview/live', session.id], {
            queryParams: {
              subMode: this.liveSubMode,
              company: this.companyName.trim() || 'Tech Company',
            },
          });
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Unable to start live interview. Please try again.';
        },
      });
  }

  private requestPermissions(): void {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        this.permissionsGranted = true;
        this.cameraPreviewStream = stream;
        if (this.previewVideo?.nativeElement) {
          this.previewVideo.nativeElement.srcObject = stream;
        }
      })
      .catch(() => {
        this.permissionsGranted = false;
        this.errorMessage = 'Camera and microphone permissions are required for Live Mode.';
      });
  }

  private applyCypressPermissionOverride(): boolean {
    const g = globalThis as any;
    if (!g.Cypress) {
      return false;
    }

    g.__setLiveStartPermissions = (granted: boolean) => {
      this.permissionsGranted = granted;
      this.errorMessage = granted ? null : 'Camera and microphone permissions are required for Live Mode.';
    };

    if (typeof g.__liveStartPermissionsGranted === 'boolean') {
      this.permissionsGranted = g.__liveStartPermissionsGranted;
      this.errorMessage = this.permissionsGranted
        ? null
        : 'Camera and microphone permissions are required for Live Mode.';
      return true;
    }

    return false;
  }
}
