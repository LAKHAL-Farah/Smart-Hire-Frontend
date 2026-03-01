import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-career-goal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step">
      <h1 class="step__headline">
        What's your <span class="step__gradient">target role?</span>
      </h1>
      <p class="step__sub">Pick the career path that excites you most. You can always change it later.</p>

      <div class="cards-grid">
        @for (path of careerPaths; track path.id) {
          <button
            class="career-card"
            [class.career-card--active]="selected === path.id"
            (click)="select(path.id)"
          >
            <div class="career-card__top-line"></div>
            <span class="career-card__emoji">{{ path.emoji }}</span>
            <span class="career-card__title">{{ path.title }}</span>
            <span class="career-card__desc">{{ path.tech }}</span>
            <span class="career-card__badge">{{ path.badge }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 720px;
      margin: 0 auto;
    }

    .step__headline {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: clamp(26px, 3.4vw, 40px);
      color: var(--text-primary);
      line-height: 1.2;
      margin-bottom: 12px;
    }

    .step__gradient {
      background: linear-gradient(135deg, #2ee8a5, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .step__sub {
      font-size: 15px;
      color: var(--text-secondary);
      margin-bottom: 40px;
      max-width: 460px;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      width: 100%;
    }

    .career-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 28px 16px 20px;
      background: rgba(19, 19, 29, 0.6);
      backdrop-filter: blur(12px);
      border: 1.5px solid var(--border-subtle);
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: var(--font-sans);
      overflow: hidden;
    }

    .career-card__top-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #2ee8a5, #10b981);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .career-card:hover {
      transform: translateY(-3px);
      border-color: rgba(46, 232, 165, 0.25);
    }
    .career-card:hover .career-card__top-line {
      opacity: 1;
    }

    .career-card--active {
      border-color: var(--accent-teal) !important;
      background: rgba(46, 232, 165, 0.04) !important;
      box-shadow: 0 0 20px rgba(46, 232, 165, 0.08);
    }
    .career-card--active .career-card__top-line {
      opacity: 1 !important;
    }

    .career-card__emoji {
      font-size: 2rem;
      line-height: 1;
    }

    .career-card__title {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .career-card__desc {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .career-card__badge {
      display: inline-block;
      margin-top: 4px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 600;
      color: var(--accent-teal);
      background: rgba(46, 232, 165, 0.08);
      border-radius: var(--radius-full);
    }

    @media (max-width: 700px) {
      .cards-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 480px) {
      .cards-grid { grid-template-columns: 1fr; max-width: 320px; margin: 0 auto; }
    }
  `]
})
export class StepCareerGoalComponent {
  @Input() selected: string | null = null;
  @Output() selectionChange = new EventEmitter<string>();

  careerPaths = [
    { id: 'frontend', emoji: '🎨', title: 'Frontend Engineer', tech: 'React, Angular, Vue, TypeScript', badge: 'High demand' },
    { id: 'backend', emoji: '⚙️', title: 'Backend Engineer', tech: 'Node.js, Python, Java, Go', badge: 'Top salary' },
    { id: 'fullstack', emoji: '🔗', title: 'Full Stack', tech: 'Next.js, MERN, Django + React', badge: 'Most versatile' },
    { id: 'devops', emoji: '☁️', title: 'DevOps / Cloud', tech: 'AWS, Docker, K8s, Terraform', badge: 'Growing fast' },
    { id: 'data', emoji: '📊', title: 'Data Engineer', tech: 'Python, SQL, Spark, Airflow', badge: 'High demand' },
    { id: 'mobile', emoji: '📱', title: 'Mobile Engineer', tech: 'React Native, Flutter, Swift', badge: 'Top salary' },
  ];

  select(id: string): void {
    this.selectionChange.emit(id);
  }
}
