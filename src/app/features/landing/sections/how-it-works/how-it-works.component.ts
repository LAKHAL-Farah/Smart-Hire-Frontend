import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hiw" id="how-it-works" #hiwSection>
      <div class="section-container">
        <p class="hiw__eyebrow">How It Works</p>

        <!-- GitHub-style scroll reveal statement -->
        <div class="scroll-text hiw__statement" #scrollText>
          <span class="word">Four</span>
          <span class="word">simple</span>
          <span class="word word--accent">steps.</span>
          <span class="word">Take</span>
          <span class="word">your</span>
          <span class="word">assessment.</span>
          <span class="word">Follow</span>
          <span class="word">your</span>
          <span class="word word--accent">roadmap.</span>
          <span class="word">Practice</span>
          <span class="word word--accent">interviews.</span>
          <span class="word">Land</span>
          <span class="word">the</span>
          <span class="word word--accent">job.</span>
        </div>

        <div class="hiw__steps">
          @for (step of steps; track step.num; let i = $index; let last = $last) {
            <div class="hiw__step">
              <div class="hiw__num-ring">
                <span>{{ step.num }}</span>
              </div>
              <h3 class="hiw__step-title">{{ step.title }}</h3>
              <p class="hiw__step-desc">{{ step.desc }}</p>
            </div>
            @if (!last) {
              <div class="hiw__connector">
                <svg width="40" height="2" viewBox="0 0 40 2">
                  <line x1="0" y1="1" x2="40" y2="1" stroke="var(--border-subtle)" stroke-width="2" stroke-dasharray="4 4"/>
                </svg>
              </div>
            }
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .hiw {
      padding: 160px 0 120px;
    }

    .hiw__eyebrow {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--accent-teal);
      margin-bottom: 24px;
    }

    .hiw__statement {
      margin-bottom: 80px;
    }

    .hiw__steps {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 0;
    }

    .hiw__step {
      flex: 1;
      max-width: 240px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .hiw__num-ring {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 2px solid var(--accent-teal);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      background: rgba(46, 232, 165, 0.06);
    }
    .hiw__num-ring span {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 700;
      color: var(--accent-teal);
    }

    .hiw__step-title {
      font-family: var(--font-display);
      font-size: 17px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .hiw__step-desc {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .hiw__connector {
      display: flex;
      align-items: center;
      padding-top: 28px;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .hiw__steps {
        flex-direction: column;
        align-items: center;
        gap: 32px;
      }
      .hiw__connector {
        transform: rotate(90deg);
        padding-top: 0;
      }
    }
  `]
})
export class HowItWorksComponent implements AfterViewInit {
  @ViewChild('hiwSection') section!: ElementRef;
  @ViewChild('scrollText') scrollText!: ElementRef;

  steps = [
    { num: '1', title: 'Take your skill assessment', desc: '5-minute AI-powered evaluation of your strengths and gaps' },
    { num: '2', title: 'Get your personalized roadmap', desc: 'Custom learning path with milestones and deadlines' },
    { num: '3', title: 'Practice interviews with AI', desc: 'Mock interviews with real-time scoring and feedback' },
    { num: '4', title: 'Apply with an optimized CV', desc: 'AI-tailored resume that matches job requirements' },
  ];

  constructor(private scrollAnim: ScrollAnimationService) {}

  ngAfterViewInit(): void {
    this.scrollAnim.scrollTextReveal(this.scrollText.nativeElement);
    this.scrollAnim.animateStagger('.hiw__step', this.section.nativeElement, { stagger: 0.2 });
  }
}
