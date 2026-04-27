import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventSpeaker, EventSpeakerDTO, EventSpeakerService } from '../../../../services/event-speaker.service';

@Component({
  selector: 'app-event-speakers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

    :host {
      --ink: #0f0f0f;
      --ink-muted: #6b6b6b;
      --ink-faint: #c8c8c8;
      --surface: #fafaf8;
      --surface-2: #f2f1ee;
      --surface-3: #e8e6e1;
      --accent: #d4522a;
      --accent-hover: #b8441f;
      --accent-light: #fdf0ec;
      --success: #2a7d4f;
      --success-bg: #edf7f2;
      --error: #c0392b;
      --error-bg: #fdf0ee;
      --radius: 12px;
      --radius-sm: 8px;
      --shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06);
      --shadow-hover: 0 4px 8px rgba(0,0,0,.08), 0 12px 32px rgba(0,0,0,.1);
      --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      display: block;
      font-family: 'DM Sans', sans-serif;
      background: var(--surface);
      color: var(--ink);
    }

    .speakers-section {
      max-width: 1100px;
      margin: 0 auto;
      padding: 48px 24px;
    }

    /* ── Header ── */
    .section-header {
      display: flex;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 48px;
      padding-bottom: 20px;
      border-bottom: 1.5px solid var(--surface-3);
    }

    .section-title {
      font-family: 'Syne', sans-serif;
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--ink);
      margin: 0;
      line-height: 1;
    }

    .speaker-count {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--ink-muted);
      background: var(--surface-2);
      padding: 4px 10px;
      border-radius: 999px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    /* ── Grid ── */
    .speakers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 56px;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 64px 24px;
      color: var(--ink-muted);
      font-size: 0.95rem;
    }

    .empty-state-icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 12px;
      opacity: 0.4;
    }

    /* ── Speaker Card ── */
    .speaker-card {
      background: #fff;
      border: 1px solid var(--surface-3);
      border-radius: var(--radius);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: var(--shadow);
      transition: var(--transition);
      position: relative;
      overflow: hidden;
    }

    .speaker-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--accent), #f0884a);
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .speaker-card:hover {
      box-shadow: var(--shadow-hover);
      transform: translateY(-2px);
      border-color: var(--ink-faint);
    }

    .speaker-card:hover::before {
      opacity: 1;
    }

    .card-top {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .speaker-avatar-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .speaker-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      background: var(--surface-2);
      border: 2px solid var(--surface-3);
    }

    .avatar-fallback {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--surface-3), var(--ink-faint));
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--ink-muted);
      flex-shrink: 0;
    }

    .speaker-meta h3 {
      font-family: 'Syne', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 2px;
      color: var(--ink);
      letter-spacing: -0.01em;
    }

    .speaker-company {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--ink-muted);
      margin: 0;
    }

    .expertise-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: var(--accent);
      background: var(--accent-light);
      padding: 3px 10px;
      border-radius: 999px;
      width: fit-content;
    }

    .speaker-bio {
      font-size: 0.85rem;
      color: var(--ink-muted);
      line-height: 1.65;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid var(--surface-2);
      margin-top: auto;
    }

    .linkedin-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 500;
      color: #0077b5;
      text-decoration: none;
      padding: 4px 0;
      transition: opacity 0.2s;
    }

    .linkedin-link:hover { opacity: 0.75; }

    .linkedin-link svg { width: 14px; height: 14px; fill: #0077b5; }

    .card-actions {
      display: flex;
      gap: 6px;
    }

    .btn-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--surface-3);
      background: transparent;
      cursor: pointer;
      font-size: 0.85rem;
      transition: var(--transition);
      color: var(--ink-muted);
    }

    .btn-icon:hover {
      background: var(--surface-2);
      border-color: var(--ink-faint);
      color: var(--ink);
    }

    .btn-icon.delete:hover {
      background: var(--error-bg);
      border-color: #f5c6c3;
      color: var(--error);
    }

    /* ── Form ── */
    .form-panel {
      background: #fff;
      border: 1px solid var(--surface-3);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .form-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 28px;
      border-bottom: 1px solid var(--surface-2);
      background: var(--surface);
    }

    .form-title {
      font-family: 'Syne', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.01em;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .form-title-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
    }

    .form-body {
      padding: 28px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field.full { grid-column: 1 / -1; }

    .field label {
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ink-muted);
    }

    .field input,
    .field textarea {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem;
      color: var(--ink);
      background: var(--surface);
      border: 1.5px solid var(--surface-3);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      outline: none;
      transition: var(--transition);
      width: 100%;
      box-sizing: border-box;
    }

    .field input::placeholder,
    .field textarea::placeholder {
      color: var(--ink-faint);
    }

    .field input:focus,
    .field textarea:focus {
      border-color: var(--accent);
      background: #fff;
      box-shadow: 0 0 0 3px rgba(212,82,42,.08);
    }

    .field textarea {
      resize: vertical;
      min-height: 90px;
      line-height: 1.6;
    }

    .form-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 28px 24px;
    }

    .form-messages {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 500;
    }

    .msg-success {
      color: var(--success);
      background: var(--success-bg);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
    }

    .msg-error {
      color: var(--error);
      background: var(--error-bg);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
    }

    .form-btns {
      display: flex;
      gap: 10px;
    }

    .btn-primary {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      padding: 10px 20px;
      border-radius: var(--radius-sm);
      border: none;
      background: var(--ink);
      color: #fff;
      cursor: pointer;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-primary:hover {
      background: var(--accent);
      transform: translateY(-1px);
    }

    .btn-secondary {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.875rem;
      font-weight: 400;
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      border: 1.5px solid var(--surface-3);
      background: transparent;
      color: var(--ink-muted);
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-secondary:hover {
      border-color: var(--ink-faint);
      color: var(--ink);
      background: var(--surface-2);
    }

    @media (max-width: 600px) {
      .form-body { grid-template-columns: 1fr; }
      .speakers-section { padding: 32px 16px; }
      .form-footer { flex-direction: column; align-items: flex-start; gap: 12px; }
    }
  `],
  template: `
    <div class="speakers-section">

      <!-- Header -->
      <div class="section-header">
        <h2 class="section-title">Speakers</h2>
        <span class="speaker-count">{{ speakers.length }} speaker{{ speakers.length !== 1 ? 's' : '' }}</span>
      </div>

      <!-- Grid -->
      <div class="speakers-grid">
        <ng-container *ngIf="speakers.length > 0; else empty">
          <div class="speaker-card" *ngFor="let s of speakers">

            <div class="card-top">
              <div class="speaker-avatar-wrap">
                <img
                  *ngIf="s.photoUrl; else initials"
                  [src]="s.photoUrl"
                  [alt]="s.firstName + ' ' + s.lastName"
                  class="speaker-avatar"
                />
                <ng-template #initials>
                  <div class="avatar-fallback">
                    {{ s.firstName[0] }}{{ s.lastName[0] }}
                  </div>
                </ng-template>
              </div>
              <div class="speaker-meta">
                <h3>{{ s.firstName }} {{ s.lastName }}</h3>
                <p class="speaker-company">{{ s.company }}</p>
              </div>
            </div>

            <span class="expertise-badge">⚡ {{ s.expertise }}</span>

            <p class="speaker-bio">{{ s.bio }}</p>

            <div class="card-footer">
              <a class="linkedin-link" [href]="s.linkedinUrl" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
              <div class="card-actions">
                <button class="btn-icon" title="Edit" (click)="editSpeaker(s)">✏️</button>
                <button class="btn-icon delete" title="Delete" (click)="deleteSpeaker(s.id)">🗑️</button>
              </div>
            </div>

          </div>
        </ng-container>

        <ng-template #empty>
          <div class="empty-state">
            <span class="empty-state-icon">🎤</span>
            No speakers added yet. Use the form below to get started.
          </div>
        </ng-template>
      </div>

      <!-- Form -->
      <div class="form-panel">
        <div class="form-header">
          <h3 class="form-title">
            <span class="form-title-dot"></span>
            {{ editing ? 'Edit Speaker' : 'Add a Speaker' }}
          </h3>
        </div>

        <div class="form-body">
          <div class="field">
            <label>First name</label>
            <input [(ngModel)]="form.firstName" placeholder="Jane" />
          </div>
          <div class="field">
            <label>Last name</label>
            <input [(ngModel)]="form.lastName" placeholder="Doe" />
          </div>
          <div class="field">
            <label>Company</label>
            <input [(ngModel)]="form.company" placeholder="Acme Corp" />
          </div>
          <div class="field">
            <label>Expertise</label>
            <input [(ngModel)]="form.expertise" placeholder="AI & Machine Learning" />
          </div>
          <div class="field full">
            <label>LinkedIn URL</label>
            <input [(ngModel)]="form.linkedinUrl" placeholder="https://linkedin.com/in/username" />
          </div>
          <div class="field full">
            <label>Bio</label>
            <textarea [(ngModel)]="form.bio" placeholder="A short biography of the speaker…"></textarea>
          </div>
        </div>

        <div class="form-footer">
          <div class="form-messages">
            <span *ngIf="successMsg" class="msg-success">✓ {{ successMsg }}</span>
            <span *ngIf="errorMsg"   class="msg-error">✕ {{ errorMsg }}</span>
          </div>
          <div class="form-btns">
            <button *ngIf="editing" class="btn-secondary" (click)="cancelEdit()">Cancel</button>
            <button class="btn-primary" (click)="submit()">
              {{ editing ? '💾 Save changes' : '+ Add Speaker' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class EventSpeakersComponent implements OnInit {
  @Input() eventId!: number;
@Input() eventDescription: string = ''; 
  speakers: EventSpeaker[] = [];
  editing = false;
  editingId: number | null = null;
  successMsg = '';
  errorMsg = '';

  form: EventSpeakerDTO = this.emptyForm();

  constructor(private speakerService: EventSpeakerService) {}

  ngOnInit(): void {
    this.loadSpeakers();
  }

  loadSpeakers(): void {
    this.speakerService.getAll().subscribe({
      next: (data) => this.speakers = data,
      error: () => this.errorMsg = 'Failed to load speakers'
    });
  }

  submit(): void {
    this.form.eventId = this.eventId;
    this.successMsg = '';
    this.errorMsg = '';

    if (this.editing && this.editingId !== null) {
      this.speakerService.update(this.editingId, this.form).subscribe({
        next: () => {
          this.successMsg = 'Speaker updated!';
          this.cancelEdit();
          this.loadSpeakers();
        },
        error: () => this.errorMsg = 'Update failed'
      });
    } else {
      this.speakerService.add(this.form).subscribe({
        next: () => {
          this.successMsg = 'Speaker added!';
          this.form = this.emptyForm();
          this.loadSpeakers();
        },
        error: (err: any) => {
          this.errorMsg = 'Add failed';
          console.log(err);
        }
      });
    }
  }

  editSpeaker(s: EventSpeaker): void {
    this.editing = true;
    this.editingId = s.id;
    this.successMsg = '';
    this.errorMsg = '';
    this.form = {
      firstName:   s.firstName,
      lastName:    s.lastName,
      bio:         s.bio,
      expertise:   s.expertise,
      company:     s.company,
      linkedinUrl: s.linkedinUrl,
      eventId:     this.eventId
    };
  }

  deleteSpeaker(id: number): void {
    this.speakerService.delete(id).subscribe({
      next: () => this.loadSpeakers(),
      error: () => this.errorMsg = 'Delete failed'
    });
  }

  cancelEdit(): void {
    this.editing = false;
    this.editingId = null;
    this.form = this.emptyForm();
  }

  private emptyForm(): EventSpeakerDTO {
    return {
      firstName: '', lastName: '', bio: '',
      expertise: '', company: '', linkedinUrl: '',
      eventId: this.eventId
    };
  }
}