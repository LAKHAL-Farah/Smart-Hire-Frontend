import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-career-goal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-career-goal.component.html',
  styleUrl: './step-career-goal.component.scss'
})
export class StepCareerGoalComponent {
  @Input() selected: string | null = null;
  @Input() customValue: string = '';
  @Output() selectionChange = new EventEmitter<string>();
  @Output() customValueChange = new EventEmitter<string>();

  careerPaths = [
    { id: 'frontend', emoji: '🎨', title: 'Frontend Engineer', tech: 'React, Angular, Vue, TypeScript', badge: 'High demand' },
    { id: 'backend', emoji: '⚙️', title: 'Backend Engineer', tech: 'Node.js, Python, Java, Go', badge: 'Top salary' },
    { id: 'fullstack', emoji: '🔗', title: 'Full Stack', tech: 'Next.js, MERN, Django + React', badge: 'Most versatile' },
    { id: 'devops', emoji: '☁️', title: 'DevOps / Cloud', tech: 'AWS, Docker, K8s, Terraform', badge: 'Growing fast' },
    { id: 'data', emoji: '📊', title: 'Data Engineer', tech: 'Python, SQL, Spark, Airflow', badge: 'High demand' },
    { id: 'mobile', emoji: '📱', title: 'Mobile Engineer', tech: 'React Native, Flutter, Swift', badge: 'Top salary' },
    { id: 'other', emoji: '✏️', title: 'Other', tech: 'Describe your target role', badge: 'Custom path' },
  ];

  select(id: string): void {
    this.selectionChange.emit(id);
  }

  onCustomInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customValueChange.emit(value);
  }
}
