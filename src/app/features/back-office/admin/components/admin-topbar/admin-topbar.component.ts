import { Component, signal, HostListener, computed, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LUCIDE_ICONS } from '../../../../../shared/lucide-icons';
import { AutheService } from '../../../../front-office/auth/authe.service';
import { AssessmentNotificationsService } from '../../../../../core/services/assessment-notifications.service';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LUCIDE_ICONS],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss'
})
export class AdminTopbarComponent implements OnInit, OnDestroy {
  searchQuery = '';
  userName = localStorage.getItem('userName') || 'Admin User';
  email = localStorage.getItem('email')  || 'Admim@gmail.com';
  notifOpen = signal(false);
  avatarOpen = signal(false);

  private readonly assessmentNotif = inject(AssessmentNotificationsService);
  private pollId: ReturnType<typeof setInterval> | null = null;

  notifications = computed(() => this.assessmentNotif.adminItems());
  notifCount = computed(() => this.assessmentNotif.adminCount());

  constructor(private router: Router, private authService: AutheService ){}

  ngOnInit(): void {
    this.assessmentNotif.refreshAdmin();
    this.pollId = setInterval(() => this.assessmentNotif.refreshAdmin(), 8_000);
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
    this.authService.logout();
    this.router.navigate(['/login']);
    console.log('Admin sign out');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {

  }
}
