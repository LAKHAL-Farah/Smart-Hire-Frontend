import { Component, Input, signal, HostListener, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <header class="topbar">
      <!-- Left: Greeting or Page Title -->
      <div class="topbar__greeting">
        @if (quizMode) {
          <p class="topbar__quiz-warning">Assessment in progress — do not close this tab</p>
        } @else if (pageTitle()) {
          <h1 class="topbar__page-title">{{ pageTitle() }}</h1>
        } @else {
          <h1 class="topbar__name">Good morning, Anis &#x1F44B;</h1>
          <p class="topbar__date">{{ formattedDate }}</p>
        }
      </div>

      <!-- Center: Search -->
      <div class="topbar__search-wrap">
        <svg class="topbar__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          class="topbar__search"
          placeholder="Search anything..."
          [(ngModel)]="searchQuery"
          name="search"
        />
      </div>

      <!-- Right: Bell + Divider + Avatar -->
      <div class="topbar__actions">
        <!-- Notifications -->
        <div class="topbar__notif-wrap">
          <button class="topbar__icon-btn" (click)="toggleNotif()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="topbar__badge">3</span>
          </button>

          @if (notifOpen()) {
            <div class="dropdown dropdown--notif">
              <span class="dropdown__title">Notifications</span>
              @for (n of notifications; track n.text) {
                <div class="dropdown__item">
                  <span class="dropdown__dot" [style.background]="n.color"></span>
                  <div class="dropdown__item-body">
                    <span class="dropdown__item-text">{{ n.text }}</span>
                    <span class="dropdown__item-time">{{ n.time }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Divider -->
        <div class="topbar__divider"></div>

        <!-- Avatar -->
        <div class="topbar__avatar-wrap">
          <button class="topbar__avatar" (click)="toggleAvatar()">
            <span class="topbar__avatar-initials">AZ</span>
          </button>

          @if (avatarOpen()) {
            <div class="dropdown dropdown--avatar">
              <a routerLink="/dashboard/profile" class="dropdown__link" (click)="avatarOpen.set(false)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Profile
              </a>
              <a routerLink="/dashboard/settings" class="dropdown__link" (click)="avatarOpen.set(false)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Settings
              </a>
              <button class="dropdown__link dropdown__link--danger" (click)="signOut()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; }

    .topbar {
      position: fixed;
      top: 0;
      left: 240px;
      right: 0;
      height: 64px;
      background: rgba(10, 10, 15, 0.8);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      z-index: 50;
    }

    /* Greeting */
    .topbar__greeting {
      flex-shrink: 0;
    }
    .topbar__name {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 500;
      font-size: 15px;
      color: var(--text-primary);
      line-height: 1.3;
    }
    .topbar__page-title {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 700;
      font-size: 17px;
      color: var(--text-primary);
      line-height: 1;
    }
    .topbar__quiz-warning {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1;
    }
    .topbar__date {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 1px;
    }

    /* Search */
    .topbar__search-wrap {
      position: relative;
      width: 320px;
      flex-shrink: 0;
    }
    .topbar__search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }
    .topbar__search {
      width: 100%;
      padding: 9px 14px 9px 38px;
      background: var(--bg-tertiary);
      border: 1.5px solid transparent;
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: 13px;
      font-family: var(--font-sans);
      outline: none;
      transition: all 0.2s ease;
    }
    .topbar__search::placeholder { color: var(--text-muted); }
    .topbar__search:focus {
      border-color: var(--accent-teal);
      box-shadow: 0 0 0 3px rgba(46,232,165,0.1);
      background: var(--bg-card);
    }

    /* Actions */
    .topbar__actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }

    .topbar__icon-btn {
      position: relative;
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 6px;
      display: flex;
      transition: color 0.2s;
    }
    .topbar__icon-btn:hover { color: var(--text-primary); }

    .topbar__badge {
      position: absolute;
      top: 0;
      right: 0;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--accent-teal);
      color: var(--bg-primary);
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .topbar__divider {
      width: 1px;
      height: 28px;
      background: var(--border-subtle);
    }

    /* Avatar */
    .topbar__avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2ee8a5, #3b82f6);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: box-shadow 0.2s;
    }
    .topbar__avatar:hover { box-shadow: 0 0 0 3px rgba(46,232,165,0.15); }
    .topbar__avatar-initials {
      font-size: 13px;
      font-weight: 700;
      color: var(--bg-primary);
    }

    /* Dropdown (shared) */
    .topbar__notif-wrap,
    .topbar__avatar-wrap {
      position: relative;
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      background: #161b28;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 8px 0;
      min-width: 260px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
      z-index: 100;
    }

    .dropdown__title {
      display: block;
      padding: 8px 16px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 4px;
    }

    .dropdown__item {
      display: flex;
      gap: 10px;
      padding: 10px 16px;
      transition: background 0.15s;
      cursor: default;
    }
    .dropdown__item:hover { background: rgba(255,255,255,0.03); }

    .dropdown__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
    }
    .dropdown__item-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .dropdown__item-text {
      font-size: 13px;
      color: var(--text-primary);
      line-height: 1.4;
    }
    .dropdown__item-time {
      font-size: 11px;
      color: var(--text-muted);
    }

    .dropdown__link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      font-size: 13px;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.15s;
      cursor: pointer;
      background: none;
      border: none;
      font-family: var(--font-sans);
      width: 100%;
      text-align: left;
    }
    .dropdown__link:hover { background: rgba(255,255,255,0.03); color: var(--text-primary); }
    .dropdown__link--danger:hover { color: #f44336; }
  `]
})
export class TopbarComponent {
  @Input() quizMode = false;
  searchQuery = '';
  notifOpen = signal(false);
  avatarOpen = signal(false);

  formattedDate = this.getFormattedDate();

  private pageTitles: Record<string, string> = {
    '/dashboard/roadmap': 'Roadmap',
    '/dashboard/assessment': 'Assessment',
    '/dashboard/projects': 'Projects',
    '/dashboard/interview': 'Interview',
    '/dashboard/cv': 'CV Optimizer',
    '/dashboard/profile': 'Profile',
    '/dashboard/settings': 'Settings',
    '/dashboard/jobs': 'Jobs',
  };

  private url = signal('');
  pageTitle = computed(() => this.pageTitles[this.url()] ?? '');

  constructor(private router: Router) {
    this.url.set(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.url.set(e.urlAfterRedirects ?? e.url);
    });
  }

  notifications = [
    { text: 'Your roadmap has a new recommended step', time: '2 min ago', color: '#2ee8a5' },
    { text: 'Practice interview score: 8.4/10', time: '1 hour ago', color: '#8b5cf6' },
    { text: 'New job match: Frontend Dev @ Spotify', time: '3 hours ago', color: '#3b82f6' },
  ];

  toggleNotif(): void {
    this.avatarOpen.set(false);
    this.notifOpen.update(v => !v);
  }

  toggleAvatar(): void {
    this.notifOpen.set(false);
    this.avatarOpen.update(v => !v);
  }

  signOut(): void {
    this.avatarOpen.set(false);
    console.log('Sign out');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    // Close dropdowns on outside click — simplified
  }

  private getFormattedDate(): string {
    const d = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
}
