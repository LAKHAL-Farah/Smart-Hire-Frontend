import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="testimonials" id="testimonials" #testimonialSection>
      <div class="section-container">
        <p class="testimonials__eyebrow">Testimonials</p>
        <h2 class="testimonials__title">Loved by students everywhere</h2>
      </div>

      <!-- Row 1 - scrolls left -->
      <div class="testimonials__track">
        <div class="testimonials__scroll testimonials__scroll--left">
          @for (t of row1; track $index) {
            <div class="testimonials__card glass-card">
              <p class="testimonials__quote">"{{ t.quote }}"</p>
              <div class="testimonials__author">
                <div class="testimonials__avatar" [style.background]="t.color"></div>
                <div>
                  <span class="testimonials__name">{{ t.name }}</span>
                  <span class="testimonials__info">{{ t.info }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Row 2 - scrolls right -->
      <div class="testimonials__track">
        <div class="testimonials__scroll testimonials__scroll--right">
          @for (t of row2; track $index) {
            <div class="testimonials__card glass-card">
              <p class="testimonials__quote">"{{ t.quote }}"</p>
              <div class="testimonials__author">
                <div class="testimonials__avatar" [style.background]="t.color"></div>
                <div>
                  <span class="testimonials__name">{{ t.name }}</span>
                  <span class="testimonials__info">{{ t.info }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .testimonials {
      padding: 120px 0;
      overflow: hidden;
    }

    .testimonials__eyebrow {
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--accent-teal);
      margin-bottom: 12px;
    }

    .testimonials__title {
      text-align: center;
      font-family: var(--font-display);
      font-size: clamp(32px, 4vw, 48px);
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 60px;
    }

    .testimonials__track {
      overflow: hidden;
      mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
      -webkit-mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
      margin-bottom: 20px;
    }

    .testimonials__scroll {
      display: flex;
      gap: 20px;
      width: max-content;
    }
    .testimonials__scroll--left {
      animation: scroll-left 40s linear infinite;
    }
    .testimonials__scroll--right {
      animation: scroll-right 40s linear infinite;
    }

    .testimonials__card {
      flex-shrink: 0;
      width: 360px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      transition: border-color 0.3s;
    }
    .testimonials__card:hover {
      border-color: var(--border-hover);
    }

    .testimonials__quote {
      font-size: 14px;
      line-height: 1.65;
      color: var(--text-secondary);
      font-style: italic;
    }

    .testimonials__author {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .testimonials__avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .testimonials__name {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .testimonials__info {
      display: block;
      font-size: 12px;
      color: var(--text-muted);
    }
  `]
})
export class TestimonialsComponent implements AfterViewInit {
  @ViewChild('testimonialSection') section!: ElementRef;

  private testimonials = [
    { name: 'Sarah M.', info: 'EPFL • Got internship at Google', quote: 'SmartHire turned my scattered learning into a clear plan. I went from failing interviews to getting offers in 3 months.', color: 'linear-gradient(135deg, #2ee8a5, #3b82f6)' },
    { name: 'Yassine K.', info: 'ENIT • Junior Dev at Datadog', quote: "The AI mock interviews were a game-changer. I practiced 50+ scenarios and walked into my real interview completely calm.", color: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
    { name: 'Léa D.', info: 'Polytechnique • SWE at Stripe', quote: "I didn't know where to start. The roadmap gave me direction, and the job matcher found roles I didn't even know existed.", color: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
    { name: 'Ahmed T.', info: 'INSAT • Full-Stack at Spotify', quote: "Best investment in my career. The skill assessment pinpointed exactly what I needed to learn. No more tutorial hell.", color: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
    { name: 'Maria P.', info: 'ESPRIT • Frontend at Vercel', quote: "The progress analytics kept me accountable. Seeing my interview scores improve week over week was incredibly motivating.", color: 'linear-gradient(135deg, #10b981, #84cc16)' },
    { name: 'Thomas R.', info: 'Centrale Lyon • SRE at AWS', quote: "I tried other platforms but SmartHire's personalization is unmatched. It actually adapts to your pace and learning style.", color: 'linear-gradient(135deg, #6366f1, #a855f7)' },
    { name: 'Fatma B.', info: "SUP'COM • Backend at Meta", quote: "From zero interview confidence to landing my dream job in 4 months. The AI feedback was more helpful than any human coach.", color: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
    { name: 'Lucas V.', info: 'ETH Zürich • ML Engineer at DeepMind', quote: "The technical assessment was spot-on. It identified gaps in my system design knowledge that I'd been ignoring for months.", color: 'linear-gradient(135deg, #14b8a6, #22d3ee)' },
  ];

  // Duplicate for infinite scroll effect
  row1 = [...this.testimonials.slice(0, 4), ...this.testimonials.slice(0, 4)];
  row2 = [...this.testimonials.slice(4, 8), ...this.testimonials.slice(4, 8)];

  constructor(private scrollAnim: ScrollAnimationService) {}

  ngAfterViewInit(): void {
    this.scrollAnim.animateFadeUp('.testimonials__eyebrow, .testimonials__title', this.section.nativeElement);
  }
}
