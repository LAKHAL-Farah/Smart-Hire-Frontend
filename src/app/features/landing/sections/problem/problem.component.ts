import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-problem',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="problem" #problemSection>
      <div class="section-container">
        <p class="problem__eyebrow">The Problem</p>

        <!-- GitHub-style big scroll text -->
        <div class="scroll-text problem__statement" #scrollText>
          <span class="word">You've</span>
          <span class="word">watched</span>
          <span class="word">100+</span>
          <span class="word">tutorials.</span>
          <span class="word">Built</span>
          <span class="word">to-do</span>
          <span class="word">apps.</span>
          <span class="word">Still</span>
          <span class="word word--accent">no</span>
          <span class="word word--accent">interviews.</span>
          <span class="word">No</span>
          <span class="word">roadmap.</span>
          <span class="word">No</span>
          <span class="word">feedback.</span>
          <span class="word">Just</span>
          <span class="word word--accent">tutorial</span>
          <span class="word word--accent">hell.</span>
        </div>

        <div class="problem__grid">
          @for (card of cards; track card.icon) {
            <div class="problem__card glass-card">
              <span class="problem__icon">{{ card.icon }}</span>
              <h3 class="problem__card-title">{{ card.title }}</h3>
              <p class="problem__text">{{ card.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .problem {
      padding: 160px 0 120px;
    }

    .problem__eyebrow {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--accent-teal);
      margin-bottom: 24px;
    }

    .problem__statement {
      margin-bottom: 80px;
    }

    .problem__grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .problem__card {
      padding: 40px 32px;
      transition: all 0.4s ease;
    }
    .problem__card:hover {
      border-color: var(--border-hover);
      transform: translateY(-4px);
      background: var(--bg-card-hover);
    }

    .problem__icon {
      font-size: 48px;
      display: block;
      margin-bottom: 16px;
    }

    .problem__card-title {
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 10px;
    }

    .problem__text {
      font-size: 15px;
      line-height: 1.6;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .problem__grid {
        grid-template-columns: 1fr;
        max-width: 400px;
        margin: 0 auto;
      }
    }
  `]
})
export class ProblemComponent implements AfterViewInit {
  @ViewChild('problemSection') section!: ElementRef;
  @ViewChild('scrollText') scrollText!: ElementRef;

  cards = [
    { icon: '📚', title: 'No clear direction', text: 'Drowning in tutorials with no structured path to employment' },
    { icon: '💼', title: 'Skills mismatch', text: "Don't know what employers actually want or how you compare" },
    { icon: '😰', title: 'Interview anxiety', text: 'Freezing in technical interviews with zero practice or feedback' },
  ];

  constructor(private scrollAnim: ScrollAnimationService) {}

  ngAfterViewInit(): void {
    // Scroll-driven word reveal on the big statement
    this.scrollAnim.scrollTextReveal(this.scrollText.nativeElement);
    // Stagger cards
    this.scrollAnim.animateStagger('.problem__card', this.section.nativeElement, { stagger: 0.2 });
  }
}
