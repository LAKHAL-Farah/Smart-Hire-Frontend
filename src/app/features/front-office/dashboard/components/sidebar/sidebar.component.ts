import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LUCIDE_ICONS } from '../../../../../shared/lucide-icons';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LUCIDE_ICONS],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() disabled = false;
  mainItems: NavItem[] = [
    { icon: 'layout-grid', label: 'Dashboard', route: '/dashboard' },
    { icon: 'activity', label: 'Assessment', route: '/dashboard/assessment' },
    { icon: 'clock', label: 'Roadmap', route: '/dashboard/roadmap' },
    { icon: 'book-open', label: 'Projects', route: '/dashboard/projects' },
    { icon: 'book-open', label: 'Events', route: '/dashboard/events' },
  ];

  prepareItems: NavItem[] = [
    { icon: 'activity', label: 'Submissions', route: '/dashboard/submissions' },
    
  ];

  recruitItems: NavItem[] = [
    { icon: 'briefcase', label: 'Jobs', route: '/dashboard/jobs' },
  ];

  logout(): void {
    console.log('Logout');
  }
}
