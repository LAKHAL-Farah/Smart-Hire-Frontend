import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-left-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="panel">
      <!-- Background layers -->
      <div class="panel__bg">
        <div class="panel__orb panel__orb--1"></div>
        <div class="panel__orb panel__orb--2"></div>
        <div class="panel__grid"></div>
      </div>

      <div class="panel__content">
        <!-- Logo -->
        <a routerLink="/" class="panel__logo">
          <div class="panel__logo-icon">S</div>
          <span class="panel__logo-text">SmartHire</span>
        </a>

        <!-- Quote -->
        <div class="panel__quote-block">
          <svg class="panel__quote-mark" width="40" height="32" viewBox="0 0 40 32" fill="none">
            <path d="M0 20.8C0 12.267 5.333 5.6 16 0.8L18 4C10.667 8 7.333 12.267 8 16.8H16V32H0V20.8ZM22 20.8C22 12.267 27.333 5.6 38 0.8L40 4C32.667 8 29.333 12.267 30 16.8H38V32H22V20.8Z" fill="url(#quoteGrad)"/>
            <defs>
              <linearGradient id="quoteGrad" x1="0" y1="0" x2="40" y2="32">
                <stop stop-color="#2ee8a5"/>
                <stop offset="1" stop-color="#3b82f6"/>
              </linearGradient>
            </defs>
          </svg>
          <blockquote class="panel__quote">
            {{ quotes[activeQuote].text }}
          </blockquote>
          <div class="panel__quote-author">
            <div class="panel__avatar">{{ quotes[activeQuote].initials }}</div>
            <div>
              <p class="panel__author-name">{{ quotes[activeQuote].name }}</p>
              <p class="panel__author-role">{{ quotes[activeQuote].role }}</p>
            </div>
          </div>

          <!-- Dots -->
          <div class="panel__dots">
            @for (q of quotes; track q.name; let i = $index) {
              <button
                class="panel__dot"
                [class.panel__dot--active]="i === activeQuote"
                (click)="activeQuote = i"
              ></button>
            }
          </div>
        </div>

        <!-- Bottom stats -->
        <div class="panel__stats">
          <div class="panel__stat">
            <span class="panel__stat-num">2,400+</span>
            <span class="panel__stat-label">Students joined</span>
          </div>
          <div class="panel__stat-divider"></div>
          <div class="panel__stat">
            <span class="panel__stat-num">89%</span>
            <span class="panel__stat-label">Got interviews</span>
          </div>
          <div class="panel__stat-divider"></div>
          <div class="panel__stat">
            <span class="panel__stat-num">4.9★</span>
            <span class="panel__stat-label">Average rating</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .panel {
      position: relative;
      height: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 40px;
      overflow: hidden;
    }

    /* ── Background ── */
    .panel__bg {
      position: absolute;
      inset: 0;
      z-index: 0;
    }

    .panel__orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
    }
    .panel__orb--1 {
      width: 450px;
      height: 450px;
      background: rgba(46, 232, 165, 0.08);
      top: -80px;
      left: -60px;
    }
    .panel__orb--2 {
      width: 350px;
      height: 350px;
      background: rgba(59, 130, 246, 0.06);
      bottom: -60px;
      right: -80px;
    }

    .panel__grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 60px 60px;
      mask-image: radial-gradient(ellipse at 30% 50%, black 20%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at 30% 50%, black 20%, transparent 70%);
    }

    /* ── Content ── */
    .panel__content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-between;
    }

    /* ── Logo ── */
    .panel__logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--text-primary);
    }

    .panel__logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--gradient-teal);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 900;
      color: var(--bg-primary);
    }

    .panel__logo-text {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 700;
    }

    /* ── Quote ── */
    .panel__quote-block {
      max-width: 420px;
    }

    .panel__quote-mark {
      margin-bottom: 20px;
      opacity: 0.6;
    }

    .panel__quote {
      font-family: var(--font-display);
      font-size: clamp(20px, 2vw, 26px);
      font-weight: 500;
      line-height: 1.45;
      color: var(--text-primary);
      margin-bottom: 28px;
    }

    .panel__quote-author {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 24px;
    }

    .panel__avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--gradient-teal);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: var(--bg-primary);
    }

    .panel__author-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .panel__author-role {
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .panel__dots {
      display: flex;
      gap: 8px;
    }

    .panel__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: none;
      background: var(--border-subtle);
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 0;
    }
    .panel__dot--active {
      background: var(--accent-teal);
      width: 24px;
      border-radius: 4px;
    }

    /* ── Stats ── */
    .panel__stats {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .panel__stat-divider {
      width: 1px;
      height: 32px;
      background: var(--border-subtle);
    }

    .panel__stat-num {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 700;
      color: var(--accent-teal);
      display: block;
    }

    .panel__stat-label {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
      display: block;
    }

    /* ── Mobile hide ── */
    @media (max-width: 960px) {
      .panel {
        min-height: auto;
        padding: 32px 24px;
      }
      .panel__quote-block {
        display: none;
      }
      .panel__stats {
        display: none;
      }
    }
  `]
})
export class AuthLeftPanelComponent {
  activeQuote = 0;

  quotes = [
    {
      text: 'SmartHire mapped out exactly what I needed to learn and prepared me for interviews. I landed my first dev role in 8 weeks.',
      name: 'Sarah Chen',
      initials: 'SC',
      role: 'Junior Frontend Developer at Vercel'
    },
    {
      text: 'The AI mock interviews were a game changer. I went from failing every technical round to getting 3 offers in a month.',
      name: 'Marcus Rivera',
      initials: 'MR',
      role: 'Software Engineer at Stripe'
    },
    {
      text: 'I was stuck in tutorial hell for two years. SmartHire gave me a clear roadmap and accountability. Best investment ever.',
      name: 'Priya Nair',
      initials: 'PN',
      role: 'Full Stack Developer at Shopify'
    }
  ];
}
