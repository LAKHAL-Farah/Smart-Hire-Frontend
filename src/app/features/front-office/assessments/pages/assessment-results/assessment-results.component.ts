import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  CodingAssessmentService,
  CodingAssessmentResult,
  formatAssessmentHttpError,
} from '../../services/coding-assessment.service';
import { SkillService, SkillProfileResponse } from '../../services/skill.service';
import { ASSESSMENT_PLACEHOLDER_USER_ID } from '../../assessment-placeholder-user';
import { ProfileApiService } from '../../../profile/profile-api.service';

@Component({
  selector: 'app-assessment-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assessment-results.component.html',
  styleUrl: './assessment-results.component.scss',
})
export class AssessmentResultsComponent implements OnInit, OnDestroy {
  sessionId: number = 0;
  result = signal<CodingAssessmentResult | null>(null);
  userSkillProfiles = signal<SkillProfileResponse[]>([]);
  isLoading = signal(true);

  private destroy$ = new Subject<void>();

  constructor(
    private codingAssessment: CodingAssessmentService,
    private skillService: SkillService,
    private profileApi: ProfileApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('sessionId'));
    if (!this.sessionId) {
      this.router.navigate(['/dashboard/assessment/start']);
      return;
    }

    this.loadResults();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadResults(): void {
    this.isLoading.set(true);
    this.codingAssessment
      .getResult(this.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.result.set(r);
          this.isLoading.set(false);
          this.syncAssessmentToUserProfile(r);
          this.loadUserSkillProfiles();
        },
        error: (err) => {
          console.error('Error loading results:', err);
          this.isLoading.set(false);
          alert(formatAssessmentHttpError(err));
          this.router.navigate(['/dashboard/assessment/start']);
        },
      });
  }

  /** Persists validated scores into MS-User profile (merge JSON). Silent failure if user service is down. */
  private syncAssessmentToUserProfile(r: CodingAssessmentResult): void {
    const payload = {
      lastAssessmentSummary: {
        kind: 'coding',
        sessionId: this.sessionId,
        at: new Date().toISOString(),
        overallScore: r.overallScore,
        skills: r.skills,
        strengths: r.strengths,
        weaknesses: r.weaknesses,
        finalTheta: r.finalTheta,
        tasksCompleted: r.tasksCompleted,
        targetTaskCount: r.targetTaskCount,
        status: r.status,
      },
      [`codingSession_${this.sessionId}`]: {
        at: new Date().toISOString(),
        overallScore: r.overallScore,
        skills: r.skills,
      },
    };
    this.profileApi.mergeAssessmentSkills(JSON.stringify(payload)).subscribe({
      error: (err) => console.warn('[SmartHire] Could not sync assessment to profile', err),
    });
  }

  loadUserSkillProfiles(): void {
    const userId = ASSESSMENT_PLACEHOLDER_USER_ID;
    this.skillService
      .getUserSkillProfiles(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profiles) => {
          this.userSkillProfiles.set(profiles);
        },
        error: (err) => {
          console.error('Error loading skill profiles:', err);
        },
      });
  }

  getScoreLevel(score: number): string {
    if (score >= 80) return 'Expert';
    if (score >= 60) return 'Advanced';
    if (score >= 40) return 'Intermediate';
    return 'Beginner';
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  retakeAssessment(): void {
    void this.router.navigate(['/dashboard/assessment/unified-start']);
  }

  viewHistory(): void {
    this.router.navigate(['/dashboard/assessment/history']);
  }

  downloadResults(): void {
    console.log('Downloading results...');
    alert('Download functionality coming soon');
  }

  downloadCertificate(): void {
    console.log('Downloading certificate...');
    alert('Certificate download coming soon');
  }

  viewDetailedReport(): void {
    console.log('Viewing detailed report...');
    alert('Detailed report view coming soon');
  }
}
