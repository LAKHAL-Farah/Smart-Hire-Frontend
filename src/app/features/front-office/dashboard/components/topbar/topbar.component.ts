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
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
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
    '/dashboard/interview': 'Interview Simulation',
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
