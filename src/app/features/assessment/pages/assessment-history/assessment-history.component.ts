import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AssessmentService } from '../../services';
import { Assessment } from '../../models';

interface AssessmentHistory extends Assessment {
  score?: number;
  skillsCount?: number;
  feedback?: string;
}

/**
 * Assessment History Page Component
 * Displays all user assessments and their historical data
 */
@Component({
  selector: 'app-assessment-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assessment-history.component.html',
  styleUrl: './assessment-history.component.scss'
})
export class AssessmentHistoryComponent implements OnInit {
  assessments = signal<AssessmentHistory[]>([]);
  loading = signal(false);
  selectedFilter = signal('all');

  filterOptions = [
    { label: 'All Assessments', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'In Progress', value: 'in_progress' },
  ];

  mockAssessments: AssessmentHistory[] = [
    {
      id: 5,
      userId: 1,
      type: 'INITIAL',
      status: 'COMPLETED',
      score: 77,
      skillsCount: 6,
      feedback: 'Great overall performance with strong frontend skills',
      createdAt: '2026-03-15T10:30:00Z',
      completedAt: '2026-03-15T10:48:00Z'
    },
    {
      id: 4,
      userId: 1,
      type: 'INTERMEDIATE',
      status: 'COMPLETED',
      score: 68,
      skillsCount: 8,
      feedback: 'Solid understanding of core concepts, room for growth in DevOps',
      createdAt: '2026-02-20T14:00:00Z',
      completedAt: '2026-02-20T14:35:00Z'
    },
    {
      id: 3,
      userId: 1,
      type: 'INITIAL',
      status: 'COMPLETED',
      score: 62,
      skillsCount: 6,
      feedback: 'Good foundation in technical skills',
      createdAt: '2026-01-10T09:15:00Z',
      completedAt: '2026-01-10T09:28:00Z'
    },
    {
      id: 2,
      userId: 1,
      type: 'ADVANCED',
      status: 'IN_PROGRESS',
      score: 0,
      skillsCount: 0,
      feedback: 'In progress...',
      createdAt: '2026-03-17T08:00:00Z',
      completedAt: undefined
    },
  ];

  constructor(
    private assessmentService: AssessmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAssessments();
  }

  loadAssessments(): void {
    this.loading.set(true);
    // TODO: Load assessments from API
    // this.assessmentService.getAssessmentsByUserId(userId).subscribe({
    //   next: (data) => {
    //     this.assessments.set(data);
    //     this.loading.set(false);
    //   },
    //   error: () => this.loading.set(false)
    // });

    // For now, use mock data
    this.assessments.set(this.mockAssessments);
    this.loading.set(false);
  }

  getFilteredAssessments(): AssessmentHistory[] {
    const filter = this.selectedFilter();
    if (filter === 'all') return this.assessments();
    return this.assessments().filter(a => a.status?.toLowerCase() === filter.replace('_', '').toLowerCase());
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-fair';
  }

  getStatusBadgeClass(status?: string): string {
    return status?.toLowerCase() === 'completed' ? 'status-completed' : 'status-in-progress';
  }

  viewDetails(assessment: AssessmentHistory): void {
    if (assessment.status?.toUpperCase() === 'COMPLETED') {
      this.router.navigate(['/dashboard/assessment/report', assessment.id]);
    }
  }

  continueAssessment(assessment: AssessmentHistory): void {
    this.router.navigate(['/dashboard/assessment/quiz', assessment.id]);
  }

  trackBy(index: number, assessment: AssessmentHistory): number {
    return assessment.id || index;
  }

  getDurationMinutes(createdAt?: string, completedAt?: string): string {
    if (!createdAt || !completedAt) return 'In progress';
    const start = new Date(createdAt).getTime();
    const end = new Date(completedAt).getTime();
    const minutes = Math.round((end - start) / 60000);
    return `${minutes}m`;
  }

  getBestScore(): number {
    const assessments = this.getFilteredAssessments();
    if (assessments.length === 0) return 0;
    return Math.max(...assessments.map(a => a.score || 0));
  }
}
