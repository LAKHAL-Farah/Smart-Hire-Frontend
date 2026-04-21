import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoadmapApiService } from '../../../../services/roadmap-api.service';

interface CareerPathCard {
  id: string;
  emoji: string;
  title: string;
  tech: string;
  badge: string;
}

@Component({
  selector: 'app-step-career-goal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-career-goal.component.html',
  styleUrl: './step-career-goal.component.scss'
})
export class StepCareerGoalComponent implements OnInit {
  @Input() selected: string | null = null;
  @Input() customValue: string = '';
  @Output() selectionChange = new EventEmitter<string>();
  @Output() customValueChange = new EventEmitter<string>();

  private readonly roadmapApi = inject(RoadmapApiService);

  careerPaths: CareerPathCard[] = [];

  ngOnInit(): void {
    this.roadmapApi.getPublishedCareerPaths().subscribe({
      next: (items) => {
        this.careerPaths = (items || []).map((item) => {
          const topics = (item.defaultTopics || '')
            .split(',')
            .map((token: string) => token.trim())
            .filter((token: string) => token.length > 0)
            .slice(0, 4)
            .join(', ');

          const difficulty = (item.difficulty || 'Unknown').toUpperCase();
          return {
            id: String(item.id),
            emoji: this.pickEmoji(item.id),
            title: item.title,
            tech: topics || 'No topics configured yet',
            badge: difficulty,
          };
        });

        // Fallback to static list if API returns nothing
        if (this.careerPaths.length === 0) {
          this.careerPaths = this.staticFallback();
        }
      },
      error: () => {
        this.careerPaths = this.staticFallback();
      },
    });
  }

  select(id: string): void {
    this.selectionChange.emit(id);
  }

  onCustomInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customValueChange.emit(value);
  }

  private pickEmoji(id: number): string {
    const emojis = ['💻', '🔧', '📊', '🎨', '🛡️', '📱', '☁️', '🤖', '🧪', '🌐', '🚀', '⚙️'];
    return emojis[id % emojis.length] || emojis[0];
  }

  private staticFallback(): CareerPathCard[] {
    return [
      { id: 'frontend', emoji: '🎨', title: 'Frontend Engineer', tech: 'React, Angular, Vue, TypeScript', badge: 'High demand' },
      { id: 'backend', emoji: '⚙️', title: 'Backend Engineer', tech: 'Node.js, Python, Java, Go', badge: 'Top salary' },
      { id: 'fullstack', emoji: '🔗', title: 'Full Stack', tech: 'Next.js, MERN, Django + React', badge: 'Most versatile' },
      { id: 'devops', emoji: '☁️', title: 'DevOps / Cloud', tech: 'AWS, Docker, K8s, Terraform', badge: 'Growing fast' },
      { id: 'data', emoji: '📊', title: 'Data Engineer', tech: 'Python, SQL, Spark, Airflow', badge: 'High demand' },
      { id: 'mobile', emoji: '📱', title: 'Mobile Engineer', tech: 'React Native, Flutter, Swift', badge: 'Top salary' },
      { id: 'other', emoji: '✏️', title: 'Other', tech: 'Describe your target role', badge: 'Custom path' },
    ];
  }
}
