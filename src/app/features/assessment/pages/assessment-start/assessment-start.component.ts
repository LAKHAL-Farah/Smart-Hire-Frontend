import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AssessmentService } from '../../services';
import { Assessment, AssessmentRequest } from '../../models';

/**
 * Assessment Start Page Component
 * Displays available assessments and allows users to start a new one
 */
@Component({
  selector: 'app-assessment-start',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assessment-start.component.html',
  styleUrl: './assessment-start.component.scss'
})
export class AssessmentStartComponent implements OnInit {
  assessments = signal<Assessment[]>([]);
  loading = signal(false);
  selectedAssessmentType = signal<string | null>(null);

  assessmentTypes = [
    {
      id: 'INITIAL',
      title: 'Initial Assessment',
      description: 'Begin your career path journey with a comprehensive skill evaluation',
      icon: '🚀',
      duration: '15-20 min',
      questions: 10,
      level: 'Beginner'
    },
    {
      id: 'INTERMEDIATE',
      title: 'Intermediate Assessment',
      description: 'Deepen your skill evaluation with more challenging questions',
      icon: '⚡',
      duration: '20-30 min',
      questions: 15,
      level: 'Intermediate'
    },
    {
      id: 'ADVANCED',
      title: 'Advanced Assessment',
      description: 'Push your limits with expert-level technical questions',
      icon: '🔥',
      duration: '30-45 min',
      questions: 20,
      level: 'Advanced'
    }
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
    // TODO: Load user's previous assessments from API
    // this.assessmentService.getAssessmentsByUserId(userId).subscribe({
    //   next: (data) => {
    //     this.assessments.set(data);
    //     this.loading.set(false);
    //   },
    //   error: () => this.loading.set(false)
    // });
  }

  selectAssessmentType(type: string): void {
    this.selectedAssessmentType.set(type);
  }

  startAssessment(type: string): void {
    this.loading.set(true);
    const userId = 1; // TODO: Get from auth service
    
    const request: AssessmentRequest = {
      userId,
      type
    };

    // TODO: Make API call to start assessment
    // this.assessmentService.createAssessment(request).subscribe({
    //   next: (assessment) => {
    //     this.router.navigate(['/dashboard/assessment/quiz', assessment.id]);
    //   },
    //   error: () => this.loading.set(false)
    // });

    // For now, navigate to quiz
    this.router.navigate(['/dashboard/assessment']);
  }
}
