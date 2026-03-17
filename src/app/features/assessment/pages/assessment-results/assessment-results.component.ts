import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Assessment Results Page Component
 * Displays detailed results and feedback after completing an assessment
 */
@Component({
  selector: 'app-assessment-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assessment-results.component.html',
  styleUrl: './assessment-results.component.scss'
})
export class AssessmentResultsComponent implements OnInit {
  @Input() assessmentId: number = 1;

  finalScore = signal(0);
  scorePercentage = signal(0);
  questionsAnswered = signal(0);
  totalQuestions = signal(10);
  timeSpent = signal('18m 24s');
  assessmentType = signal('INITIAL');

  skillBreakdown = signal([
    { skill: 'Frontend', score: 85, maxScore: 100, color: 'linear-gradient(90deg, #2ee8a5, #14b8a6)' },
    { skill: 'Backend', score: 72, maxScore: 100, color: 'linear-gradient(90deg, #3b82f6, #6366f1)' },
    { skill: 'DevOps', score: 58, maxScore: 100, color: 'linear-gradient(90deg, #f59e0b, #f97316)' },
    { skill: 'Databases', score: 68, maxScore: 100, color: 'linear-gradient(90deg, #ec4899, #f43f5e)' },
  ]);

  recommendedPaths = signal([
    { title: 'Frontend Engineer', match: 89, icon: '💻' },
    { title: 'Full-Stack Developer', match: 76, icon: '🚀' },
    { title: 'Backend Engineer', match: 71, icon: '⚙️' },
  ]);

  nextSteps = signal([
    {
      step: 1,
      title: 'Review Weak Areas',
      description: 'Focus on improving your DevOps knowledge with targeted learning'
    },
    {
      step: 2,
      title: 'Follow Learning Path',
      description: 'Start the recommended Frontend Engineer learning roadmap'
    },
    {
      step: 3,
      title: 'Retake Assessment',
      description: 'Come back in 2 weeks to track your progress'
    }
  ]);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.calculateResults();
  }

  calculateResults(): void {
    this.finalScore.set(77);
    this.scorePercentage.set(77);
    this.questionsAnswered.set(10);
  }

  viewDetailedReport(): void {
    this.router.navigate(['/dashboard/assessment/report', this.assessmentId]);
  }

  startLearning(): void {
    this.router.navigate(['/dashboard/roadmap']);
  }

  retakeAssessment(): void {
    this.router.navigate(['/dashboard/assessment']);
  }

  downloadCertificate(): void {
    // TODO: Implement certificate download
    console.log('Downloading certificate...');
  }
}
