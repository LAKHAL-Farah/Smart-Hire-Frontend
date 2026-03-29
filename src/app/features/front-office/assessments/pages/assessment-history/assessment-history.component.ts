import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AssessmentService, AssessmentHistoryItem } from '../../services/assessment.service';

/**
 * Assessment History Page Component
 * Displays all user's past assessments and performance trends
 */
@Component({
  selector: 'app-assessment-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assessment-history.component.html',
  styleUrl: './assessment-history.component.scss'
})
export class AssessmentHistoryComponent implements OnInit, OnDestroy {
  assessments = signal<AssessmentHistoryItem[]>([]);
  loading = signal(false);
  selectedSkillFilter = signal<string | null>(null);
  userId: number = 1; // TODO: Get from auth service

  skillOptions = [
    { label: 'All Skills', value: null },
    { label: 'Frontend', value: 'FRONTEND' },
    { label: 'Backend', value: 'BACKEND' },
    { label: 'Soft Skills', value: 'SOFT_SKILLS' },
    { label: 'DevOps', value: 'DEVOPS' },
    { label: 'Databases', value: 'DATABASES' },
    { label: 'Cloud', value: 'CLOUD' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private assessmentService: AssessmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAssessmentHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAssessmentHistory(): void {
    this.loading.set(true);
    this.assessmentService.getAssessmentHistory(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.assessments.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading assessment history:', err);
          this.loading.set(false);
          alert('Failed to load assessment history');
        }
      });
  }

  getFilteredAssessments(): AssessmentHistoryItem[] {
    const filter = this.selectedSkillFilter();
    if (!filter) return this.assessments();
    
    // Extract skill category from skillBreakdown key or use sessionId logic
    return this.assessments().filter(a => {
      // This would depend on how skillBreakdown is stored
      return Object.keys(a.skillBreakdown).some(skill => 
        skill.toLowerCase().includes(filter.toLowerCase())
      );
    });
  }

  getScoreLevel(score: number): string {
    if (score >= 80) return 'Expert';
    if (score >= 60) return 'Advanced';
    if (score >= 40) return 'Intermediate';
    return 'Beginner';
  }

  getScoreLevelClass(score: number): string {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDurationMinutes(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  getAverageScore(): number {
    const filtered = this.getFilteredAssessments();
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, a) => acc + a.overallScore, 0);
    return Math.round(sum / filtered.length);
  }

  getBestScore(): number {
    const filtered = this.getFilteredAssessments();
    if (filtered.length === 0) return 0;
    return Math.max(...filtered.map(a => a.overallScore));
  }

  getTotalAssessments(): number {
    return this.getFilteredAssessments().length;
  }

  viewDetails(assessment: AssessmentHistoryItem): void {
    // Navigate to view assessment details
    this.router.navigate(['/assessments/results', assessment.sessionId]);
  }

  retakeAssessment(): void {
    this.router.navigate(['/assessments/start']);
  }

  downloadReport(): void {
    // TODO: Implement PDF download for all history
    alert('Download functionality coming soon');
  }

  setSkillFilter(skill: string | null): void {
    this.selectedSkillFilter.set(skill);
  }
}
