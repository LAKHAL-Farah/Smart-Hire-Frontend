import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { HeroComponent } from './sections/hero/hero.component';
import { TrustBarComponent } from './sections/trust-bar/trust-bar.component';
import { ProblemComponent } from './sections/problem/problem.component';
import { SolutionComponent } from './sections/solution/solution.component';
import { FeaturesGridComponent } from './sections/features/features-grid.component';
import { StatsComponent } from './sections/stats/stats.component';
import { HowItWorksComponent } from './sections/how-it-works/how-it-works.component';
import { TestimonialsComponent } from './sections/testimonials/testimonials.component';
import { PricingComponent } from './sections/pricing/pricing.component';
import { CtaComponent } from './sections/cta/cta.component';
import { ScrollAnimationService } from './services/scroll-animation.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FooterComponent,
    HeroComponent,
    TrustBarComponent,
    ProblemComponent,
    SolutionComponent,
    FeaturesGridComponent,
    StatsComponent,
    HowItWorksComponent,
    TestimonialsComponent,
    PricingComponent,
    CtaComponent,
  ],
  template: `
    <app-navbar />
    <main>
      <app-hero />
      <app-trust-bar />
      <app-problem />
      <app-solution />
      <app-features-grid />
      <app-stats />
      <app-how-it-works />
      <app-testimonials />
      <app-pricing />
      <app-cta />
    </main>
    <app-footer />
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
    main {
      overflow-x: hidden;
    }
  `]
})
export class LandingPageComponent implements AfterViewInit, OnDestroy {

  constructor(private scrollAnim: ScrollAnimationService) {}

  ngAfterViewInit(): void {
    this.scrollAnim.initLenis();
    // Give DOM time to settle before refreshing triggers
    setTimeout(() => this.scrollAnim.refreshScrollTrigger(), 500);
  }

  ngOnDestroy(): void {
    this.scrollAnim.killAll();
  }
}
