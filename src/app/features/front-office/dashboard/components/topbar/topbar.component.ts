import { Component, Input, signal, HostListener, computed, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { LUCIDE_ICONS } from '../../../../../shared/lucide-icons';
import { filter } from 'rxjs/operators';
import { AutheService } from '../../../auth/authe.service';
import { AssessmentNotificationsService } from '../../../../../core/services/assessment-notifications.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LUCIDE_ICONS],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit, OnDestroy {
  @Input() quizMode = false;
  searchQuery = '';
  notifOpen = signal(false);
  avatarOpen = signal(false);

  private readonly assessmentNotif = inject(AssessmentNotificationsService);
  private pollId: ReturnType<typeof setInterval> | null = null;

  formattedDate = this.getFormattedDate();

  private pageTitles: Record<string, string> = {
    '/dashboard/roadmap': 'Roadmap',
    '/dashboard/projects': 'Projects',
    '/dashboard/interview': 'Interview Simulation',
    '/dashboard/cv': 'CV Optimizer',
    '/dashboard/profile': 'Profile',
    '/dashboard/settings': 'Settings',
    '/dashboard/jobs': 'Jobs',
    '/dashboard/assessments': 'Skill assessments',
  };

  private url = signal('');
  pageTitle = computed(() => {
    const u = this.url();
    if (u.startsWith('/dashboard/assessments')) {
      return 'Skill assessments';
    }
    return this.pageTitles[u] ?? '';
  });

  notifications = computed(() => this.assessmentNotif.candidateItems());
  notifCount = computed(() => this.assessmentNotif.candidateCount());

  constructor(private router: Router, private authService: AutheService) {
    this.url.set(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      this.url.set(e.urlAfterRedirects ?? e.url);
    });
  }

  ngOnInit(): void {
    this.assessmentNotif.refreshCandidate();
    this.pollId = setInterval(() => this.assessmentNotif.refreshCandidate(), 8_000);
  }

  ngOnDestroy(): void {
    if (this.pollId != null) {
      clearInterval(this.pollId);
    }
  }

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
    this.authService.logout();
    this.router.navigate(['/login']);
    console.log('User sign out');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(_e: Event): void {
    /* close dropdowns if needed */
  }

  private getFormattedDate(): string {
    const d = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
}