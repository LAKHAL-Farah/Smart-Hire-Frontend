import {
  Component,
  AfterViewInit,
  OnDestroy,
  OnInit,
  ElementRef,
  ViewChild,
  NgZone,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxParticlesModule, NgParticlesService } from '@tsparticles/angular';
import { loadSlim } from '@tsparticles/slim';
import type { Container, Engine, ISourceOptions, MoveDirection, OutMode } from '@tsparticles/engine';
import { ScrollAnimationService } from '../../services/scroll-animation.service';
import { gsap } from 'gsap';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, NgxParticlesModule],
  template: `
    <!-- ═══ Fixed AI Brain — follows viewport on scroll ═══ -->
    <div class="ai-brain-fixed" #aiBrain>
      <div class="ai-brain__inner" #brainInner>
        <svg class="ai-brain__svg" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="6" result="blur1"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur2"/>
              <feMerge><feMergeNode in="blur1"/><feMergeNode in="blur2"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="coreGlow" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="20"/>
            </filter>
            <filter id="connGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="lineBlur"/>
              <feMerge><feMergeNode in="lineBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="outerHaloGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="30"/>
            </filter>
            <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#2ee8a5" stop-opacity="0.22"/>
              <stop offset="25%" stop-color="#8b5cf6" stop-opacity="0.08"/>
              <stop offset="50%" stop-color="#1E3A5F" stop-opacity="0.12"/>
              <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="innerHaloGrad" cx="50%" cy="50%" r="35%">
              <stop offset="0%" stop-color="#2ee8a5" stop-opacity="0.18"/>
              <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
            </radialGradient>
          </defs>

          <!-- Outer atmospheric halo -->
          <circle cx="200" cy="200" r="190" fill="url(#haloGrad)"/>
          <circle cx="200" cy="200" r="160" fill="#2ee8a5" opacity="0.03" filter="url(#outerHaloGlow)"/>
          <circle cx="200" cy="200" r="120" fill="url(#innerHaloGrad)"/>
          <!-- Soft core glow (stronger) -->
          <circle cx="200" cy="200" r="65" fill="#2ee8a5" opacity="0.08" filter="url(#coreGlow)"/>
          <circle cx="200" cy="200" r="40" fill="#8b5cf6" opacity="0.04" filter="url(#coreGlow)"/>

          <!-- Orbital rings (wrapped for initial rotation offset) -->
          <g style="transform-origin: 200px 200px">
            <ellipse class="ai-brain__ring ai-brain__ring--1" cx="200" cy="200" rx="140" ry="48"/>
          </g>
          <g style="transform: rotate(40deg); transform-origin: 200px 200px">
            <ellipse class="ai-brain__ring ai-brain__ring--2" cx="200" cy="200" rx="115" ry="42"/>
          </g>
          <g style="transform: rotate(80deg); transform-origin: 200px 200px">
            <ellipse class="ai-brain__ring ai-brain__ring--3" cx="200" cy="200" rx="88" ry="34"/>
          </g>

          <!-- Neural connection lines -->
          <g class="ai-brain__conns" filter="url(#connGlow)">
            <!-- Center → inner -->
            <line x1="200" y1="200" x2="200" y2="135" class="conn conn--a"/>
            <line x1="200" y1="200" x2="256" y2="168" class="conn conn--b"/>
            <line x1="200" y1="200" x2="256" y2="232" class="conn conn--a"/>
            <line x1="200" y1="200" x2="200" y2="265" class="conn conn--b"/>
            <line x1="200" y1="200" x2="144" y2="232" class="conn conn--a"/>
            <line x1="200" y1="200" x2="144" y2="168" class="conn conn--b"/>
            <!-- Inner ring adjacents -->
            <line x1="200" y1="135" x2="256" y2="168" class="conn conn--c"/>
            <line x1="256" y1="168" x2="256" y2="232" class="conn conn--a"/>
            <line x1="256" y1="232" x2="200" y2="265" class="conn conn--c"/>
            <line x1="200" y1="265" x2="144" y2="232" class="conn conn--a"/>
            <line x1="144" y1="232" x2="144" y2="168" class="conn conn--c"/>
            <line x1="144" y1="168" x2="200" y2="135" class="conn conn--a"/>
            <!-- Inner → outer radial -->
            <line x1="200" y1="135" x2="200" y2="80"  class="conn conn--b"/>
            <line x1="256" y1="168" x2="305" y2="142" class="conn conn--a"/>
            <line x1="256" y1="232" x2="305" y2="258" class="conn conn--b"/>
            <line x1="200" y1="265" x2="200" y2="320" class="conn conn--a"/>
            <line x1="144" y1="232" x2="95"  y2="258" class="conn conn--b"/>
            <line x1="144" y1="168" x2="95"  y2="142" class="conn conn--a"/>
          </g>

          <!-- Outer nodes -->
          <g filter="url(#nodeGlow)">
            <circle cx="200" cy="80"  r="4"   fill="#2E86AB" class="node nd--1"/>
            <circle cx="305" cy="142" r="3.5" fill="#2ee8a5" class="node nd--2"/>
            <circle cx="305" cy="258" r="3"   fill="#8b5cf6" class="node nd--3"/>
            <circle cx="200" cy="320" r="4"   fill="#2E86AB" class="node nd--4"/>
            <circle cx="95"  cy="258" r="3.5" fill="#2ee8a5" class="node nd--5"/>
            <circle cx="95"  cy="142" r="3"   fill="#8b5cf6" class="node nd--6"/>
          </g>

          <!-- Inner nodes -->
          <g filter="url(#nodeGlow)">
            <circle cx="200" cy="135" r="5.5" fill="#2ee8a5" class="node nd--7"/>
            <circle cx="256" cy="168" r="5"   fill="#2E86AB" class="node nd--8"/>
            <circle cx="256" cy="232" r="5.5" fill="#8b5cf6" class="node nd--9"/>
            <circle cx="200" cy="265" r="5"   fill="#2ee8a5" class="node nd--10"/>
            <circle cx="144" cy="232" r="5.5" fill="#2E86AB" class="node nd--11"/>
            <circle cx="144" cy="168" r="5"   fill="#8b5cf6" class="node nd--12"/>
          </g>

          <!-- Central core — multi-layer glow -->
          <circle cx="200" cy="200" r="28" fill="#2ee8a5" opacity="0.06" filter="url(#coreGlow)"/>
          <circle cx="200" cy="200" r="20" fill="rgba(10,10,15,0.85)"
                  stroke="#2ee8a5" stroke-width="2" class="ai-brain__core-ring"/>
          <circle cx="200" cy="200" r="20" fill="none"
                  stroke="#8b5cf6" stroke-width="0.5" opacity="0.3" class="ai-brain__core-ring2"/>
          <circle cx="200" cy="200" r="10" fill="#2ee8a5" opacity="0.85"
                  filter="url(#nodeGlow)" class="ai-brain__core"/>
          <circle cx="200" cy="200" r="6" fill="white" opacity="0.15"
                  class="ai-brain__core"/>

          <!-- ★ AI Star at center (bigger, brighter) -->
          <path class="ai-brain__star"
                d="M200,178 L206,194 L222,200 L206,206 L200,222 L194,206 L178,200 L194,194 Z"
                fill="#2ee8a5" opacity="0.95" filter="url(#nodeGlow)"/>
          <path class="ai-brain__star ai-brain__star--inner"
                d="M200,188 L203,197 L212,200 L203,203 L200,212 L197,203 L188,200 L197,197 Z"
                fill="white" opacity="0.4"/>

          <!-- Micro-particles -->
          <circle cx="168" cy="102" r="1.5" fill="#2ee8a5" opacity="0.3"  class="particle p--1"/>
          <circle cx="292" cy="188" r="1"   fill="#8b5cf6" opacity="0.25" class="particle p--2"/>
          <circle cx="118" cy="278" r="1.5" fill="#2E86AB" opacity="0.3"  class="particle p--3"/>
          <circle cx="272" cy="298" r="1"   fill="#2ee8a5" opacity="0.2"  class="particle p--4"/>
          <circle cx="108" cy="118" r="1"   fill="#8b5cf6" opacity="0.25" class="particle p--5"/>
          <circle cx="322" cy="200" r="1.5" fill="#2ee8a5" opacity="0.3"  class="particle p--6"/>
          <circle cx="78"  cy="200" r="1"   fill="#2E86AB" opacity="0.2"  class="particle p--7"/>
          <circle cx="248" cy="92"  r="1"   fill="#8b5cf6" opacity="0.25" class="particle p--8"/>
        </svg>
      </div>
    </div>

    <!-- ═══ Hero Section ═══ -->
    <section class="hero" #heroSection>
      <!-- tsParticles Network Background -->
      <div class="hero__particles-wrap">
        <ngx-particles
          id="hero-particles"
          [options]="particlesOptions"
          (particlesLoaded)="onParticlesLoaded($event)"
        />
      </div>

      <!-- Radial gradient overlays -->
      <div class="hero__gradient-orb hero__gradient-orb--teal"></div>
      <div class="hero__gradient-orb hero__gradient-orb--purple"></div>
      <div class="hero__gradient-orb hero__gradient-orb--navy"></div>

      <div class="hero__content">
        <!-- Eyebrow badge -->
        <div class="hero__eyebrow">
          <span class="hero__eyebrow-icon">✦</span>
          <span>Powered by GPT-4o</span>
          <span class="hero__eyebrow-shimmer"></span>
        </div>

        <!-- Headline — word-by-word GSAP animation -->
        <h1 class="hero__title">
          <span class="hero__title-line">
            <span class="hero__word">From</span>
            <span class="hero__word">Student</span>
            <span class="hero__word">to</span>
            <span class="hero__word">Engineer</span>
            <span class="hero__word">—</span>
          </span>
          <span class="hero__title-line">
            <span class="hero__word gradient-text">AI-Guided,</span>
            <span class="hero__word gradient-text">Every</span>
            <span class="hero__word gradient-text">Step</span>
          </span>
        </h1>

        <!-- Subheadline -->
        <p class="hero__subtitle">
          SmartHire analyzes your skills, builds your roadmap, coaches your
          interviews, and matches you with jobs. All in one platform.
        </p>

        <!-- CTAs -->
        <div class="hero__actions">
          <button class="btn-primary btn-lg">
            Start Free — No Card Needed
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="btn-ghost btn-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10,8 16,12 10,16"/>
            </svg>
            See How It Works
          </button>
        </div>

        <!-- Social Proof -->
        <div class="hero__proof">
          <div class="hero__avatars">
            @for (i of avatarColors; track i) {
              <div class="hero__avatar" [style.background]="i"></div>
            }
          </div>
          <span class="hero__proof-text">
            Joined by <strong>2,400+</strong> engineering students
          </span>
        </div>
      </div>

      <!-- Dashboard Mockup -->
      <div class="hero__mockup-wrapper" #mockupWrapper>
        <div
          class="hero__mockup"
          #mockup
          [style.transform]="'perspective(1000px) rotateX(' + rotateX() + 'deg) rotateY(' + rotateY() + 'deg)'"
        >
          <div class="hero__mockup-browser">
            <div class="hero__browser-dots">
              <span></span><span></span><span></span>
            </div>
            <div class="hero__browser-url">
              <span>smarthire.ai/dashboard</span>
            </div>
          </div>
          <div class="hero__mockup-screen">
            <div class="mock-dash">
              <div class="mock-dash__sidebar">
                <div class="mock-item mock-item--active"></div>
                <div class="mock-item"></div>
                <div class="mock-item"></div>
                <div class="mock-item"></div>
                <div class="mock-item"></div>
              </div>
              <div class="mock-dash__main">
                <div class="mock-header"></div>
                <div class="mock-cards">
                  <div class="mock-card mock-card--chart">
                    <div class="mock-chart-line"></div>
                  </div>
                  <div class="mock-card mock-card--stats">
                    <div class="mock-stat"></div>
                    <div class="mock-stat"></div>
                    <div class="mock-stat"></div>
                  </div>
                </div>
                <div class="mock-table">
                  <div class="mock-row"></div>
                  <div class="mock-row"></div>
                  <div class="mock-row"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="hero__mockup-glow"></div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    /* ═══════════════════════════════════════
       FIXED AI BRAIN — transparent, no bg
       ═══════════════════════════════════════ */
    .ai-brain-fixed {
      position: fixed;
      right: 3%;
      top: 50%;
      transform: translateY(-50%);
      width: clamp(300px, 32vw, 500px);
      height: clamp(300px, 32vw, 500px);
      z-index: 5;
      pointer-events: none;
      will-change: transform, opacity;
    }

    .ai-brain__inner {
      width: 100%;
      height: 100%;
      will-change: transform;
      transition: transform 0.12s ease-out;
    }

    .ai-brain__svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      animation: brain-float 8s ease-in-out infinite;
    }

    /* Orbital rings — thicker, glowier */
    .ai-brain__ring {
      fill: none;
      stroke-width: 1.2;
      transform-box: view-box;
      transform-origin: 200px 200px;
      filter: url(#connGlow);
    }
    .ai-brain__ring--1 {
      stroke: rgba(46, 232, 165, 0.35);
      animation: brain-orbit 25s linear infinite;
    }
    .ai-brain__ring--2 {
      stroke: rgba(46, 134, 171, 0.3);
      animation: brain-orbit 35s linear infinite reverse;
    }
    .ai-brain__ring--3 {
      stroke: rgba(139, 92, 246, 0.28);
      animation: brain-orbit 20s linear infinite;
    }

    /* Connection lines — brighter pulses */
    .conn { stroke-width: 1.2; opacity: 0.15; }
    .conn--a { stroke: #2ee8a5; animation: conn-pulse 3s ease-in-out infinite; }
    .conn--b { stroke: #2E86AB; animation: conn-pulse 3s ease-in-out infinite 1s; }
    .conn--c { stroke: #8b5cf6; animation: conn-pulse 3s ease-in-out infinite 2s; }

    /* Nodes */
    .node {
      transform-box: fill-box;
      transform-origin: center;
    }
    .nd--1  { animation: node-pulse 3.2s ease-in-out infinite 0s; }
    .nd--2  { animation: node-pulse 3.2s ease-in-out infinite 0.3s; }
    .nd--3  { animation: node-pulse 3.2s ease-in-out infinite 0.6s; }
    .nd--4  { animation: node-pulse 3.2s ease-in-out infinite 0.9s; }
    .nd--5  { animation: node-pulse 3.2s ease-in-out infinite 1.2s; }
    .nd--6  { animation: node-pulse 3.2s ease-in-out infinite 1.5s; }
    .nd--7  { animation: node-pulse 2.8s ease-in-out infinite 0.15s; }
    .nd--8  { animation: node-pulse 2.8s ease-in-out infinite 0.45s; }
    .nd--9  { animation: node-pulse 2.8s ease-in-out infinite 0.75s; }
    .nd--10 { animation: node-pulse 2.8s ease-in-out infinite 1.05s; }
    .nd--11 { animation: node-pulse 2.8s ease-in-out infinite 1.35s; }
    .nd--12 { animation: node-pulse 2.8s ease-in-out infinite 1.65s; }

    /* Core */
    .ai-brain__core {
      transform-box: fill-box;
      transform-origin: center;
      animation: core-pulse 3s ease-in-out infinite;
    }
    .ai-brain__core-ring {
      transform-box: fill-box;
      transform-origin: center;
      animation: ring-breathe 3s ease-in-out infinite;
    }

    /* Star */
    .ai-brain__star {
      transform-box: view-box;
      transform-origin: 200px 200px;
      animation: brain-orbit 12s linear infinite;
    }

    /* Floating particles */
    .particle { transform-box: fill-box; transform-origin: center; }
    .p--1 { animation: particle-drift 7s ease-in-out infinite 0s; }
    .p--2 { animation: particle-drift 8s ease-in-out infinite 1s; }
    .p--3 { animation: particle-drift 6s ease-in-out infinite 2s; }
    .p--4 { animation: particle-drift 9s ease-in-out infinite 0.5s; }
    .p--5 { animation: particle-drift 7s ease-in-out infinite 1.5s; }
    .p--6 { animation: particle-drift 8s ease-in-out infinite 2.5s; }
    .p--7 { animation: particle-drift 6s ease-in-out infinite 3s; }
    .p--8 { animation: particle-drift 7s ease-in-out infinite 3.5s; }

    /* ── Brain keyframes ── */
    @keyframes brain-orbit {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes brain-float {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-14px); }
    }
    @keyframes conn-pulse {
      0%, 100% { opacity: 0.08; }
      50%      { opacity: 0.55; }
    }
    @keyframes node-pulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50%      { opacity: 1;   transform: scale(1.6); }
    }
    @keyframes core-pulse {
      0%, 100% { opacity: 0.8; transform: scale(1); }
      50%      { opacity: 1;   transform: scale(1.25); }
    }
    @keyframes ring-breathe {
      0%, 100% { opacity: 1;   transform: scale(1); }
      50%      { opacity: 0.6; transform: scale(1.08); }
    }
    /* Extra: star counter-rotation */
    .ai-brain__star--inner {
      transform-box: view-box;
      transform-origin: 200px 200px;
      animation: brain-orbit 8s linear infinite reverse;
    }
    .ai-brain__core-ring2 {
      transform-box: fill-box;
      transform-origin: center;
      animation: ring-breathe 4s ease-in-out infinite 1.5s;
    }
    @keyframes particle-drift {
      0%, 100% { opacity: 0.2; transform: translate(0, 0); }
      25%      { opacity: 0.5; transform: translate(3px, -5px); }
      50%      { opacity: 0.3; transform: translate(-3px, 4px); }
      75%      { opacity: 0.5; transform: translate(4px, 2px); }
    }


    /* ═══════════════════════════════════════
       HERO SECTION
       ═══════════════════════════════════════ */
    .hero {
      position: relative;
      min-height: 100vh;
      padding-top: 110px;
      padding-bottom: 80px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* tsParticles layer */
    .hero__particles-wrap {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    .hero__particles-wrap ::ng-deep div,
    .hero__particles-wrap ::ng-deep canvas {
      width: 100% !important;
      height: 100% !important;
    }

    /* Gradient orbs */
    .hero__gradient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      pointer-events: none;
      z-index: 0;
    }
    .hero__gradient-orb--teal {
      width: 600px; height: 600px;
      background: rgba(46, 232, 165, 0.07);
      top: -200px; left: 50%;
      transform: translateX(-50%);
    }
    .hero__gradient-orb--purple {
      width: 400px; height: 400px;
      background: rgba(139, 92, 246, 0.06);
      top: 100px; right: -100px;
    }
    .hero__gradient-orb--navy {
      width: 700px; height: 700px;
      background: rgba(30, 58, 95, 0.15);
      top: -100px; left: -200px;
    }

    /* Text content — left-aligned, leaves room for brain on right */
    .hero__content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      max-width: 780px;
      padding: 0 0 0 clamp(48px, 10vw, 160px);
    }

    .hero__eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      font-size: 13px;
      color: var(--text-secondary);
      background: rgba(19, 19, 29, 0.6);
      backdrop-filter: blur(10px);
      margin-bottom: 28px;
      position: relative;
      overflow: hidden;
    }
    .hero__eyebrow-icon {
      color: var(--accent-teal);
      font-size: 14px;
    }
    .hero__eyebrow-shimmer {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent 30%, rgba(46, 232, 165, 0.08) 50%, transparent 70%);
      background-size: 200% 100%;
      animation: shimmer 3s infinite;
    }

    .hero__title {
      font-family: var(--font-display);
      font-size: clamp(36px, 5vw, 68px);
      font-weight: 800;
      line-height: 1.08;
      letter-spacing: -0.03em;
      color: var(--text-primary);
      margin-bottom: 22px;
    }
    .hero__title-line {
      display: block;
    }
    .hero__word {
      display: inline-block;
      margin-right: 0.25em;
      /* initial hidden state set by GSAP */
      opacity: 0;
      transform: translateY(40px);
    }
    .hero__word:last-child {
      margin-right: 0;
    }

    .hero__subtitle {
      font-size: clamp(16px, 1.8vw, 19px);
      line-height: 1.65;
      color: var(--text-secondary);
      max-width: 520px;
      margin-bottom: 36px;
      opacity: 0;
    }

    .hero__actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 36px;
      opacity: 0;
    }
    .btn-lg {
      padding: 16px 32px !important;
      font-size: 16px !important;
    }

    .hero__proof {
      display: flex;
      align-items: center;
      gap: 12px;
      opacity: 0;
    }
    .hero__avatars { display: flex; }
    .hero__avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      border: 2px solid var(--bg-primary);
      margin-left: -8px;
    }
    .hero__avatar:first-child { margin-left: 0; }
    .hero__proof-text {
      font-size: 14px;
      color: var(--text-muted);
    }
    .hero__proof-text strong {
      color: var(--text-primary);
    }

    /* Mockup */
    .hero__mockup-wrapper {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 960px;
      margin: 60px auto 0;
      padding: 0 24px;
    }
    .hero__mockup {
      position: relative;
      border-radius: var(--radius-xl);
      overflow: hidden;
      border: 1px solid var(--border-subtle);
      transition: transform 0.1s ease-out;
      will-change: transform;
      background: var(--bg-secondary);
    }
    .hero__mockup-glow {
      position: absolute;
      inset: -2px;
      border-radius: inherit;
      background: linear-gradient(135deg,
        rgba(46, 232, 165, 0.15),
        rgba(59, 130, 246, 0.1),
        rgba(139, 92, 246, 0.1));
      z-index: -1;
      filter: blur(30px);
      opacity: 0.5;
      animation: pulse-glow 4s ease-in-out infinite;
    }

    .hero__mockup-browser {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid var(--border-subtle);
    }
    .hero__browser-dots { display: flex; gap: 6px; }
    .hero__browser-dots span {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
    }
    .hero__browser-dots span:first-child { background: #ff5f57; }
    .hero__browser-dots span:nth-child(2) { background: #ffbd2e; }
    .hero__browser-dots span:nth-child(3) { background: #28c840; }
    .hero__browser-url {
      flex: 1;
      background: rgba(255,255,255,0.04);
      border-radius: var(--radius-sm);
      padding: 6px 12px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .hero__mockup-screen { padding: 0; min-height: 320px; }
    .mock-dash { display: flex; height: 320px; }
    .mock-dash__sidebar {
      width: 60px;
      background: rgba(255,255,255,0.02);
      border-right: 1px solid var(--border-subtle);
      padding: 16px 12px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .mock-item {
      width: 36px; height: 36px;
      border-radius: 8px;
      background: rgba(255,255,255,0.04);
    }
    .mock-item--active {
      background: rgba(46, 232, 165, 0.15);
      border: 1px solid rgba(46, 232, 165, 0.3);
    }
    .mock-dash__main {
      flex: 1; padding: 20px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .mock-header {
      width: 200px; height: 24px;
      border-radius: 6px;
      background: rgba(255,255,255,0.06);
    }
    .mock-cards { display: flex; gap: 16px; }
    .mock-card {
      flex: 1; border-radius: 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border-subtle);
      padding: 16px;
    }
    .mock-card--chart {
      flex: 2; min-height: 120px;
      position: relative; overflow: hidden;
    }
    .mock-chart-line {
      position: absolute;
      bottom: 16px; left: 16px; right: 16px;
      height: 60px;
      background: linear-gradient(180deg, rgba(46, 232, 165, 0.1) 0%, transparent 100%);
      border-top: 2px solid var(--accent-teal);
      border-radius: 4px;
      clip-path: polygon(0% 80%, 15% 60%, 30% 70%, 50% 30%, 70% 45%, 85% 20%, 100% 35%, 100% 100%, 0% 100%);
    }
    .mock-card--stats {
      display: flex; flex-direction: column; gap: 10px;
    }
    .mock-stat {
      height: 28px; border-radius: 6px;
      background: rgba(255,255,255,0.04);
    }
    .mock-table {
      display: flex; flex-direction: column; gap: 8px;
    }
    .mock-row {
      height: 36px; border-radius: 8px;
      background: rgba(255,255,255,0.025);
    }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .hero__content { align-items: center; text-align: center; }
      .ai-brain-fixed {
        right: 50%;
        transform: translate(50%, -50%);
        width: 280px;
        height: 280px;
        opacity: 0.35;
        top: 140px;
      }
    }
    @media (max-width: 768px) {
      .hero { padding-top: 100px; }
      .hero__actions { flex-direction: column; align-items: center; }
      .hero__mockup-wrapper { margin-top: 40px; }
      .mock-dash { height: 200px; }
      .mock-dash__sidebar { display: none; }
      .ai-brain-fixed { display: none; }
    }
  `],
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroSection') heroSection!: ElementRef;
  @ViewChild('aiBrain') aiBrain!: ElementRef<HTMLElement>;
  @ViewChild('brainInner') brainInner!: ElementRef<HTMLElement>;
  @ViewChild('mockup') mockup!: ElementRef;

  rotateX = signal(0);
  rotateY = signal(0);

  avatarColors = [
    'linear-gradient(135deg, #2ee8a5, #2E86AB)',
    'linear-gradient(135deg, #8b5cf6, #ec4899)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #10b981, #84cc16)',
  ];

  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private scrollHandler: (() => void) | null = null;

  /* ─── tsParticles Navy Network Config ─── */
  particlesOptions: ISourceOptions = {
    fullScreen: { enable: false },
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'grab' },
        resize: { enable: true },
      },
      modes: {
        grab: { distance: 160, links: { opacity: 0.4 } },
      },
    },
    particles: {
      color: { value: ['#1E3A5F', '#2E86AB', '#2ee8a5'] },
      links: {
        color: '#1E3A5F',
        distance: 160,
        enable: true,
        opacity: 0.18,
        width: 1,
      },
      move: {
        direction: 'none' as MoveDirection,
        enable: true,
        outModes: { default: 'bounce' as OutMode },
        random: true,
        speed: 0.6,
        straight: false,
      },
      number: {
        density: { enable: true, width: 1200, height: 800 },
        value: 80,
      },
      opacity: {
        value: { min: 0.15, max: 0.5 },
        animation: { enable: true, speed: 0.8, sync: false },
      },
      shape: { type: 'circle' },
      size: {
        value: { min: 1, max: 3 },
      },
    },
    detectRetina: true,
  };

  constructor(
    private scrollAnim: ScrollAnimationService,
    private ngParticlesService: NgParticlesService,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.ngParticlesService.init(async (engine: Engine) => {
      await loadSlim(engine);
    });
  }

  onParticlesLoaded(container: Container): void {
    // particles ready
  }

  ngAfterViewInit(): void {
    this.initMouseParallax();
    this.initScrollFollow();
    this.animateEntrance();
  }

  /* ─── Mouse parallax — brain + mockup depth ─── */
  private initMouseParallax(): void {
    this.ngZone.runOutsideAngular(() => {
      this.mouseMoveHandler = (e: MouseEvent) => {
        const { innerWidth, innerHeight } = window;
        const nx = (e.clientX / innerWidth - 0.5);
        const ny = (e.clientY / innerHeight - 0.5);

        // Brain shifts opposite to cursor for depth illusion
        if (this.brainInner?.nativeElement) {
          const bx = -nx * 22;
          const by = -ny * 18;
          this.brainInner.nativeElement.style.transform =
            `translate3d(${bx}px, ${by}px, 0)`;
        }

        // Mockup tilt
        this.rotateX.set(ny * -8);
        this.rotateY.set(nx * 8);
      };
      window.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });
    });
  }

  /* ─── Scroll follow – brain drifts down + fades ─── */
  private initScrollFollow(): void {
    this.ngZone.runOutsideAngular(() => {
      const el = this.aiBrain?.nativeElement;
      if (!el) return;

      this.scrollHandler = () => {
        const scrollY = window.scrollY;
        const vh = window.innerHeight;
        const fadeStart = vh * 0.5;
        const fadeEnd = vh * 3.5;

        let opacity: number;
        if (scrollY <= fadeStart) {
          opacity = 1;
        } else if (scrollY >= fadeEnd) {
          opacity = 0;
        } else {
          opacity = 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart);
        }

        // Scroll-driven rotation (full 360 over ~3 viewport heights)
        const rotation = (scrollY / (vh * 3)) * 360;

        // Horizontal sine-wave drift: brain sways left ↔ right
        const sineX = Math.sin(scrollY / (vh * 0.6)) * 80; // ±80px

        // Downward parallax drift
        const parallaxY = scrollY * 0.12;

        // Slight scale pulse
        const scale = 1 + Math.sin(scrollY / (vh * 0.8)) * 0.06;

        el.style.opacity = `${opacity}`;
        el.style.transform = `translateY(calc(-50% + ${parallaxY}px)) translateX(${sineX}px) rotate(${rotation}deg) scale(${scale})`;
        el.style.visibility = opacity <= 0 ? 'hidden' : 'visible';
      };
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    });
  }

  /* ─── GSAP staggered entrance ─── */
  private animateEntrance(): void {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      delay: 0.3,
    });

    // Eyebrow
    tl.from('.hero__eyebrow', {
      y: 20, opacity: 0, duration: 0.7,
    })
    // Word-by-word headline
    .to('.hero__word', {
      y: 0, opacity: 1,
      duration: 0.6,
      stagger: 0.07,
      ease: 'power4.out',
    }, '-=0.3')
    // Subtitle
    .to('.hero__subtitle', {
      opacity: 1, y: 0, duration: 0.8,
    }, '-=0.3')
    // CTAs
    .to('.hero__actions', {
      opacity: 1, y: 0, duration: 0.7,
    }, '-=0.5')
    // Social proof
    .to('.hero__proof', {
      opacity: 1, y: 0, duration: 0.7,
    }, '-=0.4')
    // AI brain scales in
    .from('.ai-brain-fixed', {
      scale: 0.7, opacity: 0, duration: 1.4,
      ease: 'elastic.out(1, 0.55)',
    }, '-=1.4')
    // Mockup slides up
    .from('.hero__mockup', {
      y: 100, opacity: 0, duration: 1.4,
      ease: 'power4.out',
    }, '-=0.8');
  }

  ngOnDestroy(): void {
    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler);
    }
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }
}
