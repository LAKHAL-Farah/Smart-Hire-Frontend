import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { 
  AssessmentService, 
  AssessmentResultResponse
} from '../../services/assessment.service';
import { SkillService, SkillProfileResponse } from '../../services/skill.service';

/**
 * Assessment Results Page Component
 * Displays detailed results, skill breakdown, and recommendations after completing an assessment
 */
@Component({
  selector: 'app-assessment-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assessment-results.component.html',
  styleUrl: './assessment-results.component.scss'
})
export class AssessmentResultsComponent implements OnInit, OnDestroy {
  sessionId: number = 0;
  result = signal<AssessmentResultResponse | null>(null);
  userSkillProfiles = signal<SkillProfileResponse[]>([]);
  isLoading = signal(true);

  private destroy$ = new Subject<void>();

  constructor(
    private assessmentService: AssessmentService,
    private skillService: SkillService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('sessionId'));
    if (!this.sessionId) {
      this.router.navigate(['/assessments/start']);
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
    this.assessmentService.getAssessmentResult(this.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.isLoading.set(false);
          // Also load updated skill profiles
          this.loadUserSkillProfiles();
        },
        error: (err) => {
          console.error('Error loading results:', err);
          this.isLoading.set(false);
          alert('Failed to load assessment results');
          this.router.navigate(['/assessments/start']);
        }
      });
  }

  loadUserSkillProfiles(): void {
    const userId = 1; // TODO: Get from auth service
    this.skillService.getUserSkillProfiles(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profiles) => {
          this.userSkillProfiles.set(profiles);
        },
        error: (err) => {
          console.error('Error loading skill profiles:', err);
        }
      });
  }

  getScoreLevel(score: number): string {
    if (score >= 80) return 'Expert';
    if (score >= 60) return 'Advanced';
    if (score >= 40) return 'Intermediate';
    return 'Beginner';
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }

  retakeAssessment(): void {
    this.router.navigate(['/assessments/start']);
  }

  viewHistory(): void {
    // TODO: Navigate to assessment history
    this.router.navigate(['/assessments/history']);
  }

  downloadResults(): void {
    // TODO: Implement PDF download
    console.log('Downloading results...');
    alert('Download functionality coming soon');
  }

  downloadCertificate(): void {
    // TODO: Implement certificate download/generation
    console.log('Downloading certificate...');
    alert('Certificate download coming soon');
  }

  viewDetailedReport(): void {
    // TODO: Implement detailed report view (maybe a modal or new page)
    console.log('Viewing detailed report...');
    alert('Detailed report view coming soon');
  }
}
