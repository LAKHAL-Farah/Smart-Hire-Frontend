import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.sidebar--disabled]="disabled">
      <!-- Logo -->
      <a routerLink="/" class="sidebar__logo">SmartHire</a>

      <!-- Main nav groups -->
      <nav class="sidebar__nav">
        <!-- MAIN -->
        <span class="sidebar__section-label">Main</span>
        <div class="sidebar__group">
          @for (item of mainItems; track item.label) {
            <a
              [routerLink]="item.route"
              routerLinkActive="sidebar__item--active"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              class="sidebar__item"
            >
              <span class="sidebar__icon" [innerHTML]="item.icon"></span>
              <span class="sidebar__label">{{ item.label }}</span>
            </a>
          }
        </div>

        <!-- PREPARE -->
        <span class="sidebar__section-label">Prepare</span>
        <div class="sidebar__group">
          @for (item of prepareItems; track item.label) {
            <a
              [routerLink]="item.route"
              routerLinkActive="sidebar__item--active"
              class="sidebar__item"
            >
              <span class="sidebar__icon" [innerHTML]="item.icon"></span>
              <span class="sidebar__label">{{ item.label }}</span>
            </a>
          }
        </div>

        <!-- RECRUIT -->
        <span class="sidebar__section-label">Recruit</span>
        <div class="sidebar__group">
          @for (item of recruitItems; track item.label) {
            <a
              [routerLink]="item.route"
              routerLinkActive="sidebar__item--active"
              class="sidebar__item"
            >
              <span class="sidebar__icon" [innerHTML]="item.icon"></span>
              <span class="sidebar__label">{{ item.label }}</span>
            </a>
          }
        </div>
      </nav>

      <!-- Bottom -->
      <div class="sidebar__bottom">
        <a routerLink="/dashboard/settings" routerLinkActive="sidebar__item--active" class="sidebar__item">
          <span class="sidebar__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </span>
          <span class="sidebar__label">Settings</span>
        </a>
        <button class="sidebar__item sidebar__item--logout" (click)="logout()">
          <span class="sidebar__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </span>
          <span class="sidebar__label">Logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    :host { display: block; }

    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 240px;
      height: 100vh;
      background: #111D2B;
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      padding: 24px 0;
      z-index: 60;
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* Logo */
    .sidebar__logo {
      display: block;
      padding: 0 24px;
      margin-bottom: 32px;
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 20px;
      text-decoration: none;
      background: linear-gradient(135deg, #2ee8a5, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Nav */
    .sidebar__nav {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .sidebar__section-label {
      display: block;
      padding: 0 24px;
      margin-bottom: 8px;
      margin-top: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
    }

    .sidebar__group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 24px;
    }

    .sidebar__item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px 10px 24px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted);
      text-decoration: none;
      border-left: 3px solid transparent;
      transition: all 0.2s ease;
      cursor: pointer;
      border-top: none;
      border-right: none;
      border-bottom: none;
      background: none;
      font-family: var(--font-sans);
      width: 100%;
      text-align: left;
    }
    .sidebar__item:hover {
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-primary);
    }

    .sidebar__item--active {
      border-left-color: var(--accent-teal) !important;
      background: rgba(46, 232, 165, 0.05) !important;
      color: var(--accent-teal) !important;
    }
    .sidebar__item--active .sidebar__icon {
      color: var(--accent-teal);
    }

    .sidebar__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      color: inherit;
      flex-shrink: 0;
    }
    .sidebar__icon svg {
      width: 20px;
      height: 20px;
    }

    .sidebar__label {
      white-space: nowrap;
    }

    /* Bottom */
    .sidebar__bottom {
      margin-top: auto;
      border-top: 1px solid var(--border-subtle);
      padding-top: 12px;
    }

    .sidebar__item--logout:hover {
      color: #f44336;
    }

    /* Disabled state during quiz */
    .sidebar--disabled .sidebar__nav,
    .sidebar--disabled .sidebar__bottom {
      opacity: 0.3;
      pointer-events: none;
      user-select: none;
    }
  `]
})
export class SidebarComponent {
  @Input() disabled = false;
  mainItems: NavItem[] = [
    { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>', label: 'Dashboard', route: '/dashboard' },
    { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>', label: 'Assessment', route: '/dashboard/assessment' },
    { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', label: 'Roadmap', route: '/dashboard/roadmap' },
    { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>', label: 'Projects', route: '/dashboard/projects' },
  ];

  prepareItems: NavItem[] = [
    { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', label: 'Interview', route: '/dashboard/interview' },
    { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', label: 'CV Optimizer', route: '/dashboard/cv' },
    { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', label: 'Profile', route: '/dashboard/profile' },
  ];

  recruitItems: NavItem[] = [
    { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>', label: 'Jobs', route: '/dashboard/jobs' },
  ];

  logout(): void {
    console.log('Logout');
  }
}
