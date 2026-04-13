import { Component, Input, signal, HostListener, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { LUCIDE_ICONS } from '../../../../../shared/lucide-icons';
import { catchError, forkJoin, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { RoadmapApiService } from '../../../../../services/roadmap-api.service';
import { resolveRoadmapUserId } from '../../roadmap/roadmap-user-context';

interface TopbarNotification {
  id: number;
  text: string;
  time: string;
  color: string;
  isRead: boolean;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LUCIDE_ICONS],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit {
  private readonly roadmapApi = inject(RoadmapApiService);

  @Input() quizMode = false;
  searchQuery = '';
  notifOpen = signal(false);
  avatarOpen = signal(false);

  notifications = signal<TopbarNotification[]>([]);
  unreadCount = signal(0);
  displayName = signal('User');

  formattedDate = this.getFormattedDate();

  private pageTitles: Record<string, string> = {
    '/dashboard/roadmap': 'Roadmap',
    '/dashboard/projects': 'Projects',
    '/dashboard/interview': 'Interview Simulation',
    '/dashboard/cv': 'CV Optimizer',
    '/dashboard/profile': 'Profile',
    '/dashboard/settings': 'Settings',
    '/dashboard/jobs': 'Jobs',
  };

  private url = signal('');
  pageTitle = computed(() => this.pageTitles[this.url()] ?? '');
  avatarInitials = computed(() => {
    const tokens = this.displayName()
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0)
      .slice(0, 2);

    if (tokens.length === 0) {
      return 'U';
    }

    return tokens.map((token) => token.charAt(0).toUpperCase()).join('');
  });

  greetingPrefix = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    }
    if (hour < 18) {
      return 'Good afternoon';
    }
    return 'Good evening';
  });

  constructor(private router: Router) {
    this.url.set(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      this.url.set(e.urlAfterRedirects ?? e.url);
    });
  }

  ngOnInit(): void {
    this.resolveDisplayName();
    this.loadNotifications();
  }

  toggleNotif(): void {
    this.avatarOpen.set(false);
    const nextOpen = !this.notifOpen();
    this.notifOpen.set(nextOpen);
    if (nextOpen) {
      this.loadNotifications();
    }
  }

  toggleAvatar(): void {
    this.notifOpen.set(false);
    this.avatarOpen.update(v => !v);
  }

  signOut(): void {
    this.avatarOpen.set(false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('user_id');
    localStorage.removeItem('uid');
    void this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(_e: Event): void {
    /* close dropdowns if needed */
  }

  private resolveDisplayName(): void {
    const session = localStorage.getItem('user');
    if (!session) {
      return;
    }

    try {
      const parsed = JSON.parse(session) as {
        name?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
      };

      const fullName = parsed.name || `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim();
      if (fullName) {
        this.displayName.set(fullName);
        return;
      }

      if (parsed.email) {
        this.displayName.set(parsed.email.split('@')[0]);
      }
    } catch {
      // Ignore malformed local session payload.
    }
  }

  private loadNotifications(): void {
    const userId = resolveRoadmapUserId();
    if (!userId) {
      this.notifications.set([]);
      this.unreadCount.set(0);
      return;
    }

    forkJoin({
      notifications: this.roadmapApi
        .getUserNotifications(userId)
        .pipe(catchError(() => of([]))),
      unread: this.roadmapApi
        .getUnreadCount(userId)
        .pipe(catchError(() => of({ count: 0 }))),
    }).subscribe(({ notifications, unread }) => {
      const latest = notifications
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6)
        .map((item) => ({
          id: item.id,
          text: item.message,
          time: this.formatRelativeTime(item.createdAt),
          color: this.resolveNotificationColor(item.type),
          isRead: item.isRead,
        }));

      this.notifications.set(latest);
      this.unreadCount.set(unread.count ?? 0);
    });
  }

  private resolveNotificationColor(type: string | undefined): string {
    const normalized = (type || '').toUpperCase();
    if (normalized.includes('MILESTONE')) {
      return '#2ee8a5';
    }
    if (normalized.includes('WARNING') || normalized.includes('ALERT')) {
      return '#f59e0b';
    }
    if (normalized.includes('STEP')) {
      return '#3b82f6';
    }
    return '#8b5cf6';
  }

  private formatRelativeTime(timestamp: string): string {
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return 'recently';
    }

    const deltaMinutes = Math.max(1, Math.floor((Date.now() - parsed.getTime()) / 60000));
    if (deltaMinutes < 60) {
      return `${deltaMinutes} min ago`;
    }

    const deltaHours = Math.floor(deltaMinutes / 60);
    if (deltaHours < 24) {
      return `${deltaHours} hour${deltaHours > 1 ? 's' : ''} ago`;
    }

    const deltaDays = Math.floor(deltaHours / 24);
    return `${deltaDays} day${deltaDays > 1 ? 's' : ''} ago`;
  }

  private getFormattedDate(): string {
    const d = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
}
