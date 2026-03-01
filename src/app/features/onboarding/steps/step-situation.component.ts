import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-situation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step">
      <h1 class="step__headline">
        Welcome, <span class="step__gradient">where are you now?</span>
      </h1>
      <p class="step__sub">This helps us personalize your learning path and career roadmap.</p>

      <div class="cards-grid">
        @for (card of situations; track card.id) {
          <button
            class="sit-card"
            [class.sit-card--active]="selected === card.id"
            (click)="select(card.id)"
          >
            <span class="sit-card__emoji">{{ card.emoji }}</span>
            <div class="sit-card__text">
              <span class="sit-card__title">{{ card.title }}</span>
              <span class="sit-card__desc">{{ card.desc }}</span>
            </div>
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
      max-width: 640px;
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
      max-width: 440px;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      width: 100%;
    }

    .sit-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      text-align: left;
      padding: 24px;
      background: rgba(19, 19, 29, 0.6);
      backdrop-filter: blur(12px);
      border: 1.5px solid var(--border-subtle);
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: var(--font-sans);
      color: var(--text-primary);
    }
    .sit-card:hover {
      border-color: rgba(46, 232, 165, 0.25);
      background: rgba(19, 19, 29, 0.8);
    }
    .sit-card--active {
      border-color: var(--accent-teal) !important;
      background: rgba(46, 232, 165, 0.04) !important;
      box-shadow: 0 0 20px rgba(46, 232, 165, 0.08);
    }

    .sit-card__emoji {
      font-size: 1.6rem;
      line-height: 1;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .sit-card__text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .sit-card__title {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .sit-card__desc {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.45;
    }

    @media (max-width: 560px) {
      .cards-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class StepSituationComponent {
  @Input() selected: string | null = null;
  @Output() selectionChange = new EventEmitter<string>();

  situations = [
    { id: 'student', emoji: '🎓', title: 'Engineering Student', desc: 'Currently studying CS, software engineering, or a related field.' },
    { id: 'junior', emoji: '💻', title: 'Junior Engineer', desc: 'Less than 2 years of professional development experience.' },
    { id: 'switcher', emoji: '🔄', title: 'Career Switcher', desc: 'Transitioning from another field into software engineering.' },
    { id: 'experienced', emoji: '🚀', title: 'Experienced Engineer', desc: '2+ years of experience, looking to level up or switch roles.' },
  ];

  select(id: string): void {
    this.selectionChange.emit(id);
  }
}
