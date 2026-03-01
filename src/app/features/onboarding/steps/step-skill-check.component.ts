import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Question {
  text: string;
  options: { letter: string; text: string }[];
  difficulty: number;          // 1-3
  difficultyLabel: string;
}

@Component({
  selector: 'app-step-skill-check',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="step">
      <h1 class="step__headline">
        Quick <span class="step__gradient">skill check</span>
      </h1>
      <p class="step__sub">5 questions — no wrong answers. This seeds your AI profile.</p>

      <!-- Progress dots -->
      <div class="progress-dots">
        @for (q of questions; track q.text; let i = $index) {
          <div
            class="progress-dot"
            [class.progress-dot--done]="i < currentQuestion()"
            [class.progress-dot--active]="i === currentQuestion()"
          ></div>
        }
      </div>

      <!-- Question card -->
      <div class="q-card">
        <span class="q-card__label">Question {{ currentQuestion() + 1 }} of {{ questions.length }}</span>
        <h2 class="q-card__text">{{ questions[currentQuestion()].text }}</h2>

        <div class="q-card__options">
          @for (opt of questions[currentQuestion()].options; track opt.letter) {
            <button
              class="q-option"
              [class.q-option--active]="selectedAnswer() === opt.letter"
              (click)="selectAnswer(opt.letter)"
            >
              <span
                class="q-option__letter"
                [class.q-option__letter--active]="selectedAnswer() === opt.letter"
              >{{ opt.letter }}</span>
              <span class="q-option__text">{{ opt.text }}</span>
            </button>
          }
        </div>

        <!-- Difficulty indicator -->
        <div class="q-card__diff">
          @for (d of [1,2,3]; track d) {
            <span
              class="diff-dot"
              [class.diff-dot--filled]="d <= questions[currentQuestion()].difficulty"
            ></span>
          }
          <span class="diff-label">{{ questions[currentQuestion()].difficultyLabel }}</span>
        </div>
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
      max-width: 600px;
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
      margin-bottom: 28px;
    }

    /* ── Progress dots ── */
    .progress-dots {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 32px;
    }

    .progress-dot {
      width: 28px;
      height: 4px;
      border-radius: 2px;
      background: var(--border-subtle);
      transition: all 0.4s ease;
    }
    .progress-dot--active {
      width: 40px;
      background: var(--accent-teal);
    }
    .progress-dot--done {
      background: #10b981;
    }

    /* ── Question card ── */
    .q-card {
      width: 100%;
      background: rgba(19, 19, 29, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 36px;
      text-align: left;
    }

    .q-card__label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
    }

    .q-card__text {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 700;
      font-size: clamp(1rem, 1.15rem, 1.25rem);
      line-height: 1.45;
      color: var(--text-primary);
      margin: 16px 0 24px;
    }

    .q-card__options {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .q-option {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      background: transparent;
      border: 1.5px solid var(--border-subtle);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.25s ease;
      font-family: var(--font-sans);
      color: var(--text-primary);
    }
    .q-option:hover {
      border-color: rgba(46, 232, 165, 0.35);
    }
    .q-option--active {
      border-color: var(--accent-teal) !important;
      background: rgba(46, 232, 165, 0.04);
    }

    .q-option__letter {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-subtle);
      flex-shrink: 0;
      transition: all 0.25s ease;
    }
    .q-option__letter--active {
      background: var(--accent-teal) !important;
      color: var(--bg-primary) !important;
      border-color: var(--accent-teal) !important;
    }

    .q-option__text {
      font-size: 0.88rem;
      color: var(--text-primary);
    }

    /* ── Difficulty ── */
    .q-card__diff {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);
    }

    .diff-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--border-subtle);
      transition: background 0.3s;
    }
    .diff-dot--filled {
      background: var(--accent-teal);
    }

    .diff-label {
      font-size: 12px;
      color: var(--text-muted);
      margin-left: 6px;
    }

    @media (max-width: 560px) {
      .q-card { padding: 24px 20px; }
    }
  `]
})
export class StepSkillCheckComponent {
  @Input() currentQuestion = signal(0);
  @Input() selectedAnswer = signal<string | null>(null);
  @Output() answerSelected = new EventEmitter<string>();

  questions: Question[] = [
    {
      text: 'You need to center one element vertically and horizontally inside a container. Which CSS approach do you reach for first?',
      options: [
        { letter: 'A', text: 'margin: auto with position absolute' },
        { letter: 'B', text: 'display: flex with align-items and justify-content' },
        { letter: 'C', text: 'display: grid with place-items: center' },
        { letter: 'D', text: 'I usually trial-and-error until it works' },
      ],
      difficulty: 1,
      difficultyLabel: 'Beginner'
    },
    {
      text: 'Your REST API responds in 4 seconds. Where do you start investigating?',
      options: [
        { letter: 'A', text: 'Check the database query execution plan' },
        { letter: 'B', text: 'Add console.log timestamps in the route handler' },
        { letter: 'C', text: 'Profile the network waterfall in DevTools' },
        { letter: 'D', text: 'Increase the server timeout limit' },
      ],
      difficulty: 2,
      difficultyLabel: 'Intermediate'
    },
    {
      text: 'What is the time complexity of searching for an element in a balanced binary search tree?',
      options: [
        { letter: 'A', text: 'O(1)' },
        { letter: 'B', text: 'O(log n)' },
        { letter: 'C', text: 'O(n)' },
        { letter: 'D', text: 'O(n log n)' },
      ],
      difficulty: 2,
      difficultyLabel: 'Intermediate'
    },
    {
      text: 'A teammate pushes directly to main and it breaks CI. What is the best process improvement?',
      options: [
        { letter: 'A', text: 'Add branch protection rules requiring PR reviews' },
        { letter: 'B', text: 'Send the whole team an email about proper workflow' },
        { letter: 'C', text: 'Revert the commit and move on' },
        { letter: 'D', text: 'Set up a pre-push hook on their machine' },
      ],
      difficulty: 1,
      difficultyLabel: 'Beginner'
    },
    {
      text: 'You are designing a schema for a social feed. Posts have millions of likes. How do you store the like count efficiently?',
      options: [
        { letter: 'A', text: 'COUNT(*) query on the likes table each request' },
        { letter: 'B', text: 'Denormalized counter column with atomic increments' },
        { letter: 'C', text: 'Cache the count in Redis with no persistence' },
        { letter: 'D', text: 'Store likes as a JSON array on the post document' },
      ],
      difficulty: 3,
      difficultyLabel: 'Advanced'
    },
  ];

  selectAnswer(letter: string): void {
    this.answerSelected.emit(letter);
  }
}
