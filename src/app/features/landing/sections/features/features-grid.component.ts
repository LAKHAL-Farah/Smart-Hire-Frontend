import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-features-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="features" id="features" #featuresSection>
      <div class="section-container">
        <p class="features__eyebrow">Features</p>

        <!-- GitHub-style scroll reveal statement -->
        <div class="scroll-text features__statement" #scrollText>
          <span class="word">One</span>
          <span class="word">platform.</span>
          <span class="word">Everything</span>
          <span class="word">you</span>
          <span class="word">need</span>
          <span class="word">to</span>
          <span class="word word--accent">assess,</span>
          <span class="word word--accent">learn,</span>
          <span class="word word--accent">practice,</span>
          <span class="word">and</span>
          <span class="word word--accent">land</span>
          <span class="word">your</span>
          <span class="word">dream</span>
          <span class="word">role.</span>
        </div>

        <div class="features__grid">
          @for (f of features; track f.title) {
            <div class="features__card glow-border">
              <div class="features__card-inner">
                <div class="features__icon">{{ f.icon }}</div>
                <h3 class="features__card-title">{{ f.title }}</h3>
                <p class="features__card-desc">{{ f.desc }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .features {
      padding: 160px 0 120px;
    }

    .features__eyebrow {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--accent-teal);
      margin-bottom: 24px;
    }

    .features__statement {
      margin-bottom: 80px;
    }

    .features__grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .features__card {
      border-radius: var(--radius-lg);
      cursor: default;
      transition: transform 0.4s ease;
    }
    .features__card:hover {
      transform: translateY(-4px);
    }

    .features__card-inner {
      padding: 36px 28px;
    }

    .features__icon {
      font-size: 36px;
      margin-bottom: 16px;
    }

    .features__card-title {
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 10px;
    }

    .features__card-desc {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-secondary);
    }

    @media (max-width: 1024px) {
      .features__grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .features__grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
    }
  `]
})
export class FeaturesGridComponent implements AfterViewInit {
  @ViewChild('featuresSection') section!: ElementRef;
  @ViewChild('scrollText') scrollText!: ElementRef;

  features = [
    { icon: '🎯', title: 'AI Skill Assessment', desc: 'Instant analysis of your technical skills with actionable gap identification across 50+ technologies.' },
    { icon: '🗺️', title: 'Personalized Roadmaps', desc: 'Custom learning paths with curated resources, milestones, and time estimates tailored to your career goal.' },
    { icon: '🤖', title: 'AI Mock Interviews', desc: 'Realistic interview simulations with real-time feedback, scoring, and targeted improvement suggestions.' },
    { icon: '📄', title: 'Smart CV Builder', desc: 'AI-optimized resumes that highlight your strengths and match specific job requirements.' },
    { icon: '🔗', title: 'Job Matching Engine', desc: 'Intelligent matching algorithm that connects you with opportunities aligned to your skill profile.' },
    { icon: '📊', title: 'Progress Analytics', desc: 'Track your growth with detailed dashboards, streaks, and performance trends over time.' },
  ];

  constructor(private scrollAnim: ScrollAnimationService) {}

  ngAfterViewInit(): void {
    this.scrollAnim.scrollTextReveal(this.scrollText.nativeElement);
    this.scrollAnim.animateStagger('.features__card', this.section.nativeElement, { stagger: 0.12, y: 50 });
  }
}
