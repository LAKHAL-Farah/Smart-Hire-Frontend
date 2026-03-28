import { Component, Input, signal, HostListener, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { LUCIDE_ICONS } from '../../../../../shared/lucide-icons';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { resolveCurrentUserId } from '../../interview/interview-user.util';
import { StreakService } from '../../interview/services/streak.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LUCIDE_ICONS],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  private readonly streakService = inject(StreakService);

  @Input() quizMode = false;
  searchQuery = '';
  notifOpen = signal(false);
  avatarOpen = signal(false);
  streakPulse = signal(false);

  readonly userId = resolveCurrentUserId();
  readonly streak = toSignal(this.streakService.streak$, { initialValue: null });
  readonly currentStreak = computed(() => this.streak()?.currentStreak ?? 0);
  readonly longestStreak = computed(() => this.streak()?.longestStreak ?? 0);

  formattedDate = this.getFormattedDate();

  private pageTitles: Record<string, string> = {
    '/dashboard/roadmap': 'Roadmap',
    '/dashboard/assessment': 'Assessment',
    '/dashboard/projects': 'Projects',
    '/dashboard/interview': 'Interview Simulation',
    '/dashboard/interview/discover': 'Discover Questions',
    '/dashboard/cv': 'CV Optimizer',
    '/dashboard/profile': 'Profile',
    '/dashboard/settings': 'Settings',
    '/dashboard/jobs': 'Jobs',
  };

  private url = signal('');
  pageTitle = computed(() => this.pageTitles[this.url()] ?? '');

  constructor(private router: Router) {
    this.url.set(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((e: any) => {
        this.url.set(e.urlAfterRedirects ?? e.url);
      });

    if (this.userId) {
      this.streakService
        .ensureLoaded(this.userId)
        .pipe(takeUntilDestroyed())
        .subscribe();

      this.streakService.streakIncrease$
        .pipe(takeUntilDestroyed())
        .subscribe(() => {
          this.streakPulse.set(true);
          setTimeout(() => {
            this.streakPulse.set(false);
          }, 1200);
        });
    }
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
