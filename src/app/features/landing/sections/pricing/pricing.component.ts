import { Component, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss'
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
