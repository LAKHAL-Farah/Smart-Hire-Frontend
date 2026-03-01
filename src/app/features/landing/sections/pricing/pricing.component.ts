import { Component, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="pricing" id="pricing" #pricingSection>
      <div class="section-container">
        <p class="pricing__eyebrow">Pricing</p>
        <h2 class="pricing__title">Simple, transparent pricing</h2>

        <!-- Toggle -->
        <div class="pricing__toggle">
          <span [class.active]="!isAnnual()">Monthly</span>
          <button class="pricing__switch" [class.on]="isAnnual()" (click)="isAnnual.set(!isAnnual())">
            <div class="pricing__switch-thumb"></div>
          </button>
          <span [class.active]="isAnnual()">
            Annual
            <span class="pricing__save-badge">Save 20%</span>
          </span>
        </div>

        <div class="pricing__grid">
          @for (plan of plans; track plan.name) {
            <div class="pricing__card glass-card" [class.pricing__card--featured]="plan.featured">
              @if (plan.featured) {
                <div class="pricing__popular">Most Popular</div>
              }
              <h3 class="pricing__plan-name">{{ plan.name }}</h3>
              <div class="pricing__price">
                <span class="pricing__currency">{{ plan.price === 0 ? '' : '€' }}</span>
                <span class="pricing__amount">{{ plan.price === 0 ? 'Free' : (isAnnual() ? (plan.price * 0.8 | number:'1.2-2') : plan.price) }}</span>
                @if (plan.price > 0) {
                  <span class="pricing__period">/mo</span>
                }
              </div>
              <p class="pricing__plan-desc">{{ plan.desc }}</p>
              <ul class="pricing__features">
                @for (feat of plan.features; track feat) {
                  <li>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3 3 7-7" stroke="var(--accent-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    {{ feat }}
                  </li>
                }
              </ul>
              <button [class]="plan.featured ? 'btn-primary w-full' : 'btn-ghost w-full'">
                {{ plan.cta }}
              </button>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .pricing {
      padding: 120px 0;
    }

    .pricing__eyebrow {
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--accent-teal);
      margin-bottom: 12px;
    }

    .pricing__title {
      text-align: center;
      font-family: var(--font-display);
      font-size: clamp(32px, 4vw, 48px);
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 32px;
    }

    /* Toggle */
    .pricing__toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      margin-bottom: 60px;
      font-size: 14px;
      color: var(--text-muted);
    }
    .pricing__toggle span.active {
      color: var(--text-primary);
      font-weight: 600;
    }
    .pricing__switch {
      width: 48px;
      height: 26px;
      border-radius: 13px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-tertiary);
      cursor: pointer;
      position: relative;
      transition: all 0.3s;
      padding: 0;
    }
    .pricing__switch.on {
      background: var(--accent-teal);
      border-color: var(--accent-teal);
    }
    .pricing__switch-thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: white;
      transition: transform 0.3s;
    }
    .pricing__switch.on .pricing__switch-thumb {
      transform: translateX(22px);
    }
    .pricing__save-badge {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent-teal);
      background: rgba(46, 232, 165, 0.1);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      margin-left: 6px;
    }

    /* Grid */
    .pricing__grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      align-items: start;
    }

    .pricing__card {
      padding: 40px 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      position: relative;
      transition: all 0.4s;
    }
    .pricing__card:hover {
      border-color: var(--border-hover);
      transform: translateY(-4px);
    }

    .pricing__card--featured {
      border-color: var(--accent-teal) !important;
      box-shadow: 0 0 40px rgba(46, 232, 165, 0.1);
      transform: scale(1.04);
    }
    .pricing__card--featured:hover {
      transform: scale(1.04) translateY(-4px);
    }

    .pricing__popular {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      font-weight: 700;
      color: var(--bg-primary);
      background: var(--accent-teal);
      padding: 4px 16px;
      border-radius: var(--radius-full);
      white-space: nowrap;
    }

    .pricing__plan-name {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .pricing__price {
      display: flex;
      align-items: baseline;
      gap: 2px;
    }
    .pricing__currency {
      font-size: 24px;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .pricing__amount {
      font-family: var(--font-display);
      font-size: 48px;
      font-weight: 800;
      color: var(--text-primary);
    }
    .pricing__period {
      font-size: 15px;
      color: var(--text-muted);
    }

    .pricing__plan-desc {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .pricing__features {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }
    .pricing__features li {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .w-full {
      width: 100%;
      justify-content: center;
    }

    @media (max-width: 768px) {
      .pricing__grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
      .pricing__card--featured { transform: none; }
      .pricing__card--featured:hover { transform: translateY(-4px); }
    }
  `]
})
export class PricingComponent implements AfterViewInit {
  @ViewChild('pricingSection') section!: ElementRef;

  isAnnual = signal(false);

  plans = [
    {
      name: 'Free',
      price: 0,
      desc: 'Get started with the basics. No credit card required.',
      featured: false,
      cta: 'Start Free',
      features: [
        'Skill assessment (1 per month)',
        'Basic career roadmap',
        '3 AI mock interviews',
        'Community access',
      ],
    },
    {
      name: 'Premium',
      price: 9.99,
      desc: 'Everything you need to accelerate your career.',
      featured: true,
      cta: 'Start Premium',
      features: [
        'Unlimited skill assessments',
        'Advanced personalized roadmaps',
        'Unlimited AI mock interviews',
        'Smart CV builder',
        'Job matching engine',
        'Progress analytics dashboard',
      ],
    },
    {
      name: 'Recruiter',
      price: 299,
      desc: 'For companies looking to hire top engineering talent.',
      featured: false,
      cta: 'Contact Sales',
      features: [
        'Access to candidate pool',
        'AI-matched candidate lists',
        'Interview scheduling tools',
        'Analytics & reporting',
        'Dedicated account manager',
      ],
    },
  ];

  constructor(private scrollAnim: ScrollAnimationService) {}

  ngAfterViewInit(): void {
    this.scrollAnim.animateFadeUp('.pricing__eyebrow, .pricing__title', this.section.nativeElement);
    this.scrollAnim.animateStagger('.pricing__card', this.section.nativeElement, { stagger: 0.15, y: 50 });
  }
}
