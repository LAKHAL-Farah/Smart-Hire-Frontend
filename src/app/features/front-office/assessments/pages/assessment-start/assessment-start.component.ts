import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AssessmentService, StartAssessmentRequest } from '../../services/assessment.service';

/**
 * Assessment Start Page Component
 * Displays skill categories and allows users to start adaptive assessments
 */
@Component({
  selector: 'app-assessment-start',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assessment-start.component.html',
  styleUrl: './assessment-start.component.scss'
})
export class AssessmentStartComponent implements OnInit {
  loading = signal(false);
  selectedSkill = signal<string | null>(null);
  userId: number = 1; // TODO: Get from auth service

  skillCategories = [
    {
      id: 'FRONTEND',
      title: 'Frontend Development',
      description: 'HTML, CSS, JavaScript, TypeScript, React, Angular, Vue',
      icon: '🎨',
      duration: '10-15 min',
      questions: '8-15',
      color: 'blue'
    },
    {
      id: 'BACKEND',
      title: 'Backend Development',
      description: 'Java, Node.js, Python, Spring Boot, REST APIs, Databases',
      icon: '⚙️',
      duration: '10-15 min',
      questions: '8-15',
      color: 'green'
    },
    {
      id: 'SOFT_SKILLS',
      title: 'Soft Skills',
      description: 'Communication, Leadership, Time Management, Problem Solving',
      icon: '🤝',
      duration: '10-15 min',
      questions: '8-15',
      color: 'purple'
    },
    {
      id: 'DEVOPS',
      title: 'DevOps',
      description: 'Docker, Kubernetes, CI/CD, Linux, AWS, Infrastructure',
      icon: '🚀',
      duration: '10-15 min',
      questions: '8-15',
      color: 'orange'
    },
    {
      id: 'DATABASES',
      title: 'Databases',
      description: 'SQL, NoSQL, MySQL, MongoDB, PostgreSQL, Database Design',
      icon: '💾',
      duration: '10-15 min',
      questions: '8-15',
      color: 'cyan'
    },
    {
      id: 'CLOUD',
      title: 'Cloud Computing',
      description: 'AWS, Azure, Google Cloud, Cloud Architecture, Scalability',
      icon: '☁️',
      duration: '10-15 min',
      questions: '8-15',
      color: 'indigo'
    }
  ];

  constructor(
    private assessmentService: AssessmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize component
  }

  selectSkill(skillId: string): void {
    this.selectedSkill.set(skillId);
  }

  startAssessment(skillId: string): void {
    if (!skillId) return;

    this.loading.set(true);
    
    const request: StartAssessmentRequest = {
      userId: this.userId,
      skillCategory: skillId
    };

    this.assessmentService.startAssessment(request).subscribe({
      next: (session) => {
        this.loading.set(false);
        // Navigate to assessment questions page with session ID
        this.router.navigate(['/dashboard/assessment/questions', session.id]);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error starting assessment:', err);
        alert('Failed to start assessment. Please try again.');
      }
    });
  }
}
