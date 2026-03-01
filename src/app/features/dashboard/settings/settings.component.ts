import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type SettingsCategory = 'account' | 'security' | 'notifications' | 'subscription' | 'connected' | 'privacy';

interface NotificationSetting {
  name: string;
  description: string;
  enabled: boolean;
}

interface ConnectedAccount {
  provider: string;
  icon: string;
  color: string;
  connected: boolean;
  username?: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <h1 class="settings-title">Settings</h1>
      <div class="settings-layout">

        <!-- ═══ LEFT: Settings Nav ═══ -->
        <nav class="settings-nav">
          @for (cat of categories; track cat.id) {
            <button class="nav-item"
              [class.nav-item--active]="activeCategory() === cat.id"
              (click)="activeCategory.set(cat.id)">
              <span class="nav-item__strip"></span>
              {{ cat.label }}
            </button>
          }
        </nav>

        <!-- ═══ RIGHT: Content ═══ -->
        <main class="settings-content">

          <!-- ══ ACCOUNT ══ -->
          @if (activeCategory() === 'account') {
            <section class="section-card">
              <h2 class="section-card__heading">Account</h2>

              <!-- Avatar upload -->
              <div class="avatar-upload">
                <div class="avatar-upload__circle">
                  <span class="avatar-upload__initials">AK</span>
                  <div class="avatar-upload__overlay">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </div>
                </div>
                <span class="avatar-upload__hint">Click to change photo</span>
              </div>

              <!-- Form -->
              <div class="form-grid">
                <div class="form-field">
                  <label class="form-label">First Name</label>
                  <input class="form-input" type="text" [(ngModel)]="firstName"/>
                </div>
                <div class="form-field">
                  <label class="form-label">Last Name</label>
                  <input class="form-input" type="text" [(ngModel)]="lastName"/>
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">
                  Email
                  <a class="form-link" href="javascript:void(0)">Change Email</a>
                </label>
                <input class="form-input" type="email" [(ngModel)]="email"/>
              </div>
              <div class="form-field">
                <label class="form-label">Headline</label>
                <input class="form-input" type="text" [(ngModel)]="headline"/>
              </div>
              <div class="form-field">
                <label class="form-label">Location</label>
                <input class="form-input" type="text" [(ngModel)]="location"/>
              </div>
              <div class="form-field">
                <label class="form-label">Bio</label>
                <textarea class="form-textarea" rows="4" [(ngModel)]="bio"></textarea>
              </div>
              <button class="btn-save">Save Changes</button>
            </section>
          }

          <!-- ══ SECURITY ══ -->
          @if (activeCategory() === 'security') {
            <section class="section-card">
              <h2 class="section-card__heading">Change Password</h2>
              <div class="form-field">
                <label class="form-label">Current Password</label>
                <input class="form-input" type="password" placeholder="Enter current password"/>
              </div>
              <div class="form-field">
                <label class="form-label">New Password</label>
                <input class="form-input" type="password" placeholder="Enter new password"/>
              </div>
              <div class="form-field">
                <label class="form-label">Confirm New Password</label>
                <input class="form-input" type="password" placeholder="Confirm new password"/>
              </div>
              <button class="btn-save">Update Password</button>
            </section>

            <section class="section-card">
              <h2 class="section-card__heading">Multi-Factor Authentication</h2>
              <div class="mfa-row">
                <div class="mfa-info">
                  <span class="mfa-status" [class.mfa-status--on]="mfaEnabled" [class.mfa-status--off]="!mfaEnabled">
                    {{ mfaEnabled ? 'Enabled' : 'Disabled' }}
                  </span>
                  @if (mfaEnabled) {
                    <span class="mfa-app">Connected via Google Authenticator</span>
                    <a class="mfa-remove" href="javascript:void(0)" (click)="mfaEnabled = false">Remove</a>
                  }
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="mfaEnabled"/>
                  <span class="toggle__track">
                    <span class="toggle__thumb"></span>
                  </span>
                </label>
              </div>
            </section>
          }

          <!-- ══ NOTIFICATIONS ══ -->
          @if (activeCategory() === 'notifications') {
            <section class="section-card">
              <h2 class="section-card__heading">Notifications</h2>
              @for (notif of notifications; track notif.name) {
                <div class="notif-row">
                  <div class="notif-info">
                    <span class="notif-name">{{ notif.name }}</span>
                    <span class="notif-desc">{{ notif.description }}</span>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="notif.enabled"/>
                    <span class="toggle__track">
                      <span class="toggle__thumb"></span>
                    </span>
                  </label>
                </div>
              }
            </section>
          }

          <!-- ══ SUBSCRIPTION ══ -->
          @if (activeCategory() === 'subscription') {
            <section class="section-card">
              <h2 class="section-card__heading">Subscription</h2>
              <div class="plan-card" [class.plan-card--premium]="isPremium">
                <div class="plan-card__header">
                  <span class="plan-card__name">{{ isPremium ? 'Premium Plan' : 'Free Plan' }}</span>
                  @if (isPremium) {
                    <span class="plan-card__badge">Active</span>
                  }
                </div>
                <ul class="plan-card__features">
                  @for (f of (isPremium ? premiumFeatures : freeFeatures); track f) {
                    <li class="plan-feature">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ee8a5" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {{ f }}
                    </li>
                  }
                </ul>
                @if (isPremium) {
                  <div class="plan-card__footer">
                    <span class="plan-card__renewal">Renews on Mar 15, 2026</span>
                    <button class="btn-manage">Manage Billing</button>
                  </div>
                } @else {
                  <button class="btn-upgrade">Upgrade to Premium</button>
                }
              </div>
            </section>
          }

          <!-- ══ CONNECTED ACCOUNTS ══ -->
          @if (activeCategory() === 'connected') {
            <section class="section-card">
              <h2 class="section-card__heading">Connected Accounts</h2>
              @for (acc of connectedAccounts; track acc.provider) {
                <div class="connected-row">
                  <div class="connected-row__logo" [style.background]="acc.color" [innerHTML]="acc.icon"></div>
                  <div class="connected-row__info">
                    <span class="connected-row__name">{{ acc.provider }}</span>
                    @if (acc.connected) {
                      <span class="connected-row__status connected-row__status--on">Connected — {{ acc.username }}</span>
                    } @else {
                      <span class="connected-row__status connected-row__status--off">Not connected</span>
                    }
                  </div>
                  @if (acc.connected) {
                    <a class="connected-row__action connected-row__action--disconnect" href="javascript:void(0)" (click)="acc.connected = false">Disconnect</a>
                  } @else {
                    <button class="connected-row__action connected-row__action--connect" (click)="acc.connected = true">Connect</button>
                  }
                </div>
              }
            </section>
          }

          <!-- ══ PRIVACY ══ -->
          @if (activeCategory() === 'privacy') {
            <section class="section-card">
              <h2 class="section-card__heading">Privacy</h2>
              <div class="notif-row">
                <div class="notif-info">
                  <span class="notif-name">Profile Visibility</span>
                  <span class="notif-desc">Allow recruiters to discover and view your profile</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="profilePublic"/>
                  <span class="toggle__track">
                    <span class="toggle__thumb"></span>
                  </span>
                </label>
              </div>
              <div class="notif-row">
                <div class="notif-info">
                  <span class="notif-name">Show Assessment Scores</span>
                  <span class="notif-desc">Display your skill assessment results on your public profile</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="showScores"/>
                  <span class="toggle__track">
                    <span class="toggle__thumb"></span>
                  </span>
                </label>
              </div>
              <div class="notif-row">
                <div class="notif-info">
                  <span class="notif-name">Activity Status</span>
                  <span class="notif-desc">Show when you were last active on the platform</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="showActivity"/>
                  <span class="toggle__track">
                    <span class="toggle__thumb"></span>
                  </span>
                </label>
              </div>
              <div class="privacy-danger">
                <h3 class="privacy-danger__title">Danger Zone</h3>
                <p class="privacy-danger__text">Permanently delete your account and all associated data. This action cannot be undone.</p>
                <button class="btn-danger">Delete Account</button>
              </div>
            </section>
          }

        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 32px; max-width: 1100px; }

    .settings-title {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 1.3rem;
      color: var(--text-primary);
      margin-bottom: 24px;
    }

    /* ═══ LAYOUT ═══ */
    .settings-layout {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 28px;
    }
    @media (max-width: 800px) { .settings-layout { grid-template-columns: 1fr; } }

    /* ═══ LEFT NAV ═══ */
    .settings-nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0;
      padding: 11px 16px;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      font-family: var(--font-sans);
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s;
      position: relative;
      text-align: left;
    }
    .nav-item:hover { color: var(--text-secondary); background: rgba(255,255,255,0.02); }
    .nav-item__strip {
      width: 3px;
      height: 20px;
      border-radius: 2px;
      margin-right: 12px;
      background: transparent;
      transition: background 0.2s;
    }
    .nav-item--active {
      color: var(--accent-teal) !important;
      background: rgba(46,232,165,0.04) !important;
    }
    .nav-item--active .nav-item__strip {
      background: var(--accent-teal);
    }

    /* ═══ CONTENT ═══ */
    .settings-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .section-card__heading {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 700;
      font-size: 15px;
      color: var(--text-primary);
    }

    /* ─── Avatar upload ─── */
    .avatar-upload {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .avatar-upload__circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2ee8a5, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
    }
    .avatar-upload__initials {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 800;
      font-size: 24px;
      color: #fff;
    }
    .avatar-upload__overlay {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
      color: #fff;
    }
    .avatar-upload__circle:hover .avatar-upload__overlay { opacity: 1; }
    .avatar-upload__hint {
      font-size: 11px;
      color: var(--text-muted);
    }

    /* ─── Forms ─── */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .form-link {
      font-size: 11px;
      color: var(--accent-teal);
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .form-link:hover { opacity: 0.7; }

    .form-input, .form-textarea {
      padding: 10px 14px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: var(--bg-tertiary);
      color: var(--text-primary);
      font-size: 13px;
      font-family: var(--font-sans);
      outline: none;
      transition: border-color 0.2s;
    }
    .form-input:focus, .form-textarea:focus {
      border-color: var(--accent-teal);
      box-shadow: 0 0 0 3px rgba(46,232,165,0.08);
    }
    .form-textarea { resize: vertical; line-height: 1.6; }

    .btn-save {
      align-self: flex-start;
      padding: 10px 28px;
      border: none;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #2ee8a5, #14b8a6);
      color: var(--bg-primary);
      font-size: 13px;
      font-weight: 600;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-save:hover { opacity: 0.88; }

    /* ─── MFA ─── */
    .mfa-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .mfa-info { display: flex; flex-direction: column; gap: 4px; }
    .mfa-status {
      font-size: 13px;
      font-weight: 600;
    }
    .mfa-status--on { color: var(--accent-teal); }
    .mfa-status--off { color: var(--text-muted); }
    .mfa-app { font-size: 12px; color: var(--text-muted); }
    .mfa-remove {
      font-size: 12px;
      color: #ef4444;
      text-decoration: none;
      cursor: pointer;
    }
    .mfa-remove:hover { text-decoration: underline; }

    /* ─── Toggle ─── */
    .toggle {
      position: relative;
      cursor: pointer;
      display: inline-flex;
      flex-shrink: 0;
    }
    .toggle input { display: none; }
    .toggle__track {
      width: 40px;
      height: 22px;
      background: var(--bg-tertiary);
      border: 1.5px solid var(--border-subtle);
      border-radius: 11px;
      position: relative;
      transition: all 0.2s;
    }
    .toggle__thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--text-muted);
      transition: all 0.2s;
    }
    .toggle input:checked + .toggle__track {
      background: rgba(46,232,165,0.15);
      border-color: var(--accent-teal);
    }
    .toggle input:checked + .toggle__track .toggle__thumb {
      left: 20px;
      background: var(--accent-teal);
    }

    /* ─── Notification rows ─── */
    .notif-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 0;
      border-bottom: 1px solid var(--border-subtle);
    }
    .notif-row:last-of-type { border-bottom: none; }
    .notif-info { display: flex; flex-direction: column; gap: 2px; }
    .notif-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
    .notif-desc { font-size: 12px; color: var(--text-muted); }

    /* ─── Subscription ─── */
    .plan-card {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .plan-card--premium { border-color: rgba(46,232,165,0.2); }
    .plan-card__header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .plan-card__name {
      font-family: 'Syne', var(--font-display), sans-serif;
      font-weight: 700;
      font-size: 16px;
      color: var(--text-primary);
    }
    .plan-card__badge {
      padding: 2px 10px;
      border-radius: var(--radius-full);
      background: rgba(46,232,165,0.12);
      color: var(--accent-teal);
      font-size: 11px;
      font-weight: 600;
    }
    .plan-card__features {
      list-style: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .plan-feature {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--text-secondary);
    }
    .plan-card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
    }
    .plan-card__renewal { font-size: 12px; color: var(--text-muted); }
    .btn-manage {
      padding: 8px 20px;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 500;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-manage:hover { border-color: rgba(255,255,255,0.12); }
    .btn-upgrade {
      align-self: flex-start;
      padding: 10px 28px;
      border: none;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #2ee8a5, #14b8a6);
      color: var(--bg-primary);
      font-size: 13px;
      font-weight: 600;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-upgrade:hover { opacity: 0.88; }

    /* ─── Connected accounts ─── */
    .connected-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid var(--border-subtle);
    }
    .connected-row:last-of-type { border-bottom: none; }
    .connected-row__logo {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #fff;
    }
    .connected-row__info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .connected-row__name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
    .connected-row__status { font-size: 12px; }
    .connected-row__status--on { color: var(--accent-teal); }
    .connected-row__status--off { color: var(--text-muted); }

    .connected-row__action {
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .connected-row__action--disconnect {
      color: #ef4444;
      background: none;
      border: none;
      font-family: var(--font-sans);
    }
    .connected-row__action--connect {
      padding: 6px 16px;
      border: 1.5px solid var(--accent-teal);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--accent-teal);
      font-family: var(--font-sans);
    }
    .connected-row__action:hover { opacity: 0.7; }

    /* ─── Privacy / Danger ─── */
    .privacy-danger {
      margin-top: 12px;
      padding: 20px;
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: var(--radius-md);
      background: rgba(239,68,68,0.03);
    }
    .privacy-danger__title {
      font-size: 13px;
      font-weight: 600;
      color: #ef4444;
      margin-bottom: 6px;
    }
    .privacy-danger__text {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 14px;
    }
    .btn-danger {
      padding: 8px 20px;
      border: 1.5px solid #ef4444;
      border-radius: var(--radius-md);
      background: transparent;
      color: #ef4444;
      font-size: 12px;
      font-weight: 600;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-danger:hover { background: rgba(239,68,68,0.08); }
  `]
})
export class SettingsComponent {
  activeCategory = signal<SettingsCategory>('account');

  categories: { id: SettingsCategory; label: string }[] = [
    { id: 'account', label: 'Account' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'connected', label: 'Connected Accounts' },
    { id: 'privacy', label: 'Privacy' },
  ];

  /* ── Account ── */
  firstName = 'Alex';
  lastName = 'Karev';
  email = 'alex.karev@email.com';
  headline = 'Full-Stack Engineer & AI Enthusiast';
  location = 'San Francisco, CA';
  bio = 'I am a full-stack engineer with 4+ years of experience building scalable web applications and AI-powered tools.';

  /* ── Security ── */
  mfaEnabled = true;

  /* ── Notifications ── */
  notifications: NotificationSetting[] = [
    { name: 'Job Alerts', description: 'Get notified when new jobs match your profile', enabled: true },
    { name: 'Interview Reminders', description: 'Reminders before scheduled mock or real interviews', enabled: true },
    { name: 'Weekly Report', description: 'A summary of your progress and activity each week', enabled: false },
    { name: 'AI Recommendations', description: 'Personalized tips from SmartHire AI', enabled: true },
    { name: 'Application Updates', description: 'Status changes on your job applications', enabled: true },
  ];

  /* ── Subscription ── */
  isPremium = false;
  freeFeatures = [
    '5 job applications per month',
    'Basic skill assessments',
    'Limited CV optimization',
    'Community access',
  ];
  premiumFeatures = [
    'Unlimited job applications',
    'Advanced AI skill assessments',
    'Full CV optimizer with AI rewriting',
    'Priority job matching',
    'Mock interview simulator',
    'GitHub & LinkedIn deep analysis',
  ];

  /* ── Connected Accounts ── */
  connectedAccounts: ConnectedAccount[] = [
    {
      provider: 'Google',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
      color: '#4285f4',
      connected: true,
      username: 'alex.karev@gmail.com',
    },
    {
      provider: 'GitHub',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>',
      color: '#333',
      connected: true,
      username: 'alexkarev',
    },
    {
      provider: 'LinkedIn',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
      color: '#0077b5',
      connected: false,
    },
    {
      provider: 'Microsoft',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><rect x="1" y="1" width="10" height="10"/><rect x="13" y="1" width="10" height="10"/><rect x="1" y="13" width="10" height="10"/><rect x="13" y="13" width="10" height="10"/></svg>',
      color: '#00a4ef',
      connected: false,
    },
  ];

  /* ── Privacy ── */
  profilePublic = true;
  showScores = true;
  showActivity = false;
}
