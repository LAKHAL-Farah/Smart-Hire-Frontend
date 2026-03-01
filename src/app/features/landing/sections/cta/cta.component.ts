import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimationService } from '../../services/scroll-animation.service';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="cta" #ctaSection>
      <div class="cta__bg">
        <div class="cta__orb cta__orb--1"></div>
        <div class="cta__orb cta__orb--2"></div>
      </div>
      <div class="section-container cta__content">
        <!-- GitHub-style scroll reveal statement -->
        <div class="scroll-text cta__statement" #scrollText>
          <span class="word">Ready</span>
          <span class="word">to</span>
          <span class="word">stop</span>
          <span class="word word--accent">guessing</span>
          <span class="word">and</span>
          <span class="word">start</span>
          <span class="word word--accent">building</span>
          <span class="word">your</span>
          <span class="word">career</span>
          <span class="word">with</span>
          <span class="word word--accent">AI?</span>
        </div>

        <p class="cta__subtitle">Join 2,400+ students already building their careers with SmartHire.</p>
        <button class="btn-primary btn-lg">
          Start Free — No Card Needed
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .cta {
      position: relative;
      padding: 160px 0 120px;
      overflow: hidden;
    }

    .cta__bg {
      position: absolute;
      inset: 0;
      z-index: 0;
    }
    .cta__orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
    }
    .cta__orb--1 {
      width: 500px;
      height: 500px;
      background: rgba(46, 232, 165, 0.08);
      top: -100px;
      left: 20%;
    }
    .cta__orb--2 {
      width: 400px;
      height: 400px;
      background: rgba(139, 92, 246, 0.06);
      bottom: -100px;
      right: 20%;
    }

    .cta__content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .cta__statement {
      text-align: center;
      margin: 0 auto 40px;
    }

    .cta__subtitle {
      font-size: 18px;
      color: var(--text-secondary);
      margin-bottom: 40px;
      text-align: center;
    }

    .btn-lg {
      padding: 18px 36px !important;
      font-size: 16px !important;
    }
  `]
})
export class CtaComponent implements AfterViewInit {
  @ViewChild('ctaSection') section!: ElementRef;
  @ViewChild('scrollText') scrollText!: ElementRef;

  constructor(private scrollAnim: ScrollAnimationService) {}

  ngAfterViewInit(): void {
    this.scrollAnim.scrollTextReveal(this.scrollText.nativeElement);
    this.scrollAnim.animateFadeUp('.cta__subtitle, .btn-primary', this.section.nativeElement, { delay: 0.3 });
  }
}
