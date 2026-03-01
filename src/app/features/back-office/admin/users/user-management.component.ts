import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: 'Candidate' | 'Recruiter' | 'Admin';
  plan: 'Free' | 'Premium' | 'Recruiter';
  status: 'Active' | 'Suspended' | 'Pending';
  joined: string;
  lastActive: string;
  assessments: number;
  interviews: number;
  location: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent {
  /* ── Filters ── */
  searchQuery = '';
  roleFilter = 'All';
  statusFilter = 'All';
  planFilter = 'All';
  roles = ['All', 'Candidate', 'Recruiter', 'Admin'];
  statuses = ['All', 'Active', 'Suspended', 'Pending'];
  plans = ['All', 'Free', 'Premium', 'Recruiter'];

  /* ── Pagination ── */
  currentPage = 1;
  pageSize = 15;
  totalUsers = 1284;
  get totalPages(): number { return Math.ceil(this.filteredUsers.length / this.pageSize); }
  get paginatedUsers(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  /* ── Selection / Bulk ── */
  selectedIds = new Set<number>();
  allChecked = false;

  /* ── Drawer ── */
  drawerOpen = false;
  drawerUser: User | null = null;

  /* ── Action dropdown ── */
  openMenuId: number | null = null;

  /* ── Data ── */
  users: User[] = [
    { id: 1, name: 'Sarah Chen', email: 'sarah.chen@mail.com', avatar: 'SC', role: 'Candidate', plan: 'Premium', status: 'Active', joined: 'Jan 15, 2024', lastActive: '2 min ago', assessments: 12, interviews: 4, location: 'San Francisco, CA' },
    { id: 2, name: 'Marcus Johnson', email: 'marcus.j@company.io', avatar: 'MJ', role: 'Recruiter', plan: 'Recruiter', status: 'Active', joined: 'Dec 03, 2023', lastActive: '1 hr ago', assessments: 0, interviews: 38, location: 'New York, NY' },
    { id: 3, name: 'Aisha Patel', email: 'aisha.p@email.com', avatar: 'AP', role: 'Candidate', plan: 'Free', status: 'Active', joined: 'Mar 22, 2024', lastActive: '5 min ago', assessments: 7, interviews: 2, location: 'London, UK' },
    { id: 4, name: 'James Wilson', email: 'j.wilson@corp.com', avatar: 'JW', role: 'Recruiter', plan: 'Recruiter', status: 'Pending', joined: 'Apr 10, 2024', lastActive: 'Never', assessments: 0, interviews: 0, location: 'Chicago, IL' },
    { id: 5, name: 'Elena Rodriguez', email: 'elena.r@mail.com', avatar: 'ER', role: 'Candidate', plan: 'Premium', status: 'Active', joined: 'Feb 28, 2024', lastActive: '30 min ago', assessments: 15, interviews: 6, location: 'Madrid, Spain' },
    { id: 6, name: 'Kenji Tanaka', email: 'kenji.t@tech.jp', avatar: 'KT', role: 'Candidate', plan: 'Free', status: 'Suspended', joined: 'Nov 12, 2023', lastActive: '3 days ago', assessments: 3, interviews: 1, location: 'Tokyo, Japan' },
    { id: 7, name: 'Lisa Müller', email: 'lisa.m@web.de', avatar: 'LM', role: 'Admin', plan: 'Premium', status: 'Active', joined: 'Sep 01, 2023', lastActive: '15 min ago', assessments: 0, interviews: 0, location: 'Berlin, Germany' },
    { id: 8, name: 'David Kim', email: 'david.k@email.com', avatar: 'DK', role: 'Candidate', plan: 'Free', status: 'Active', joined: 'Apr 02, 2024', lastActive: '1 hr ago', assessments: 5, interviews: 0, location: 'Seoul, Korea' },
    { id: 9, name: 'Fatima Al-Hassan', email: 'fatima.h@mail.com', avatar: 'FA', role: 'Candidate', plan: 'Premium', status: 'Active', joined: 'Jan 30, 2024', lastActive: '10 min ago', assessments: 20, interviews: 8, location: 'Dubai, UAE' },
    { id: 10, name: 'Ryan O\'Brien', email: 'ryan.ob@corp.ie', avatar: 'RO', role: 'Recruiter', plan: 'Recruiter', status: 'Active', joined: 'Oct 18, 2023', lastActive: '45 min ago', assessments: 0, interviews: 52, location: 'Dublin, Ireland' },
    { id: 11, name: 'Priya Sharma', email: 'priya.s@tech.in', avatar: 'PS', role: 'Candidate', plan: 'Free', status: 'Active', joined: 'Mar 05, 2024', lastActive: '2 hr ago', assessments: 9, interviews: 3, location: 'Mumbai, India' },
    { id: 12, name: 'Thomas Laurent', email: 't.laurent@mail.fr', avatar: 'TL', role: 'Candidate', plan: 'Free', status: 'Pending', joined: 'Apr 14, 2024', lastActive: 'Never', assessments: 0, interviews: 0, location: 'Paris, France' },
    { id: 13, name: 'Olivia Brown', email: 'olivia.b@email.com', avatar: 'OB', role: 'Candidate', plan: 'Premium', status: 'Active', joined: 'Feb 11, 2024', lastActive: '20 min ago', assessments: 11, interviews: 5, location: 'Sydney, Australia' },
    { id: 14, name: 'Ahmed Bakr', email: 'ahmed.b@mail.eg', avatar: 'AB', role: 'Candidate', plan: 'Free', status: 'Suspended', joined: 'Dec 20, 2023', lastActive: '1 week ago', assessments: 2, interviews: 0, location: 'Cairo, Egypt' },
    { id: 15, name: 'Mei Lin Zhang', email: 'meilin@tech.cn', avatar: 'MZ', role: 'Recruiter', plan: 'Recruiter', status: 'Active', joined: 'Nov 25, 2023', lastActive: '5 min ago', assessments: 0, interviews: 41, location: 'Shanghai, China' },
    { id: 16, name: 'Carlos Mendez', email: 'carlos.m@mail.mx', avatar: 'CM', role: 'Candidate', plan: 'Premium', status: 'Active', joined: 'Mar 18, 2024', lastActive: '1 hr ago', assessments: 8, interviews: 3, location: 'Mexico City, MX' },
  ];

  /* ── Filtered list ── */
  get filteredUsers(): User[] {
    return this.users.filter(u => {
      const matchSearch = !this.searchQuery ||
        u.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchRole = this.roleFilter === 'All' || u.role === this.roleFilter;
      const matchStatus = this.statusFilter === 'All' || u.status === this.statusFilter;
      const matchPlan = this.planFilter === 'All' || u.plan === this.planFilter;
      return matchSearch && matchRole && matchStatus && matchPlan;
    });
  }

  /* ── Helpers ── */
  getRoleClass(role: string): string {
    return role === 'Candidate' ? 'pill--teal' : role === 'Recruiter' ? 'pill--purple' : 'pill--red';
  }
  getPlanClass(plan: string): string {
    return plan === 'Free' ? 'pill--gray' : plan === 'Premium' ? 'pill--amber' : 'pill--purple';
  }
  getStatusClass(status: string): string {
    return status === 'Active' ? 'badge--green' : status === 'Suspended' ? 'badge--red' : 'badge--yellow';
  }
  avatarGradient(role: string): string {
    return role === 'Candidate' ? 'linear-gradient(135deg,#2ee8a5,#0ea5e9)' :
           role === 'Recruiter' ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' :
           'linear-gradient(135deg,#f87171,#ef4444)';
  }

  /* ── Checkbox logic ── */
  toggleAll(): void {
    if (this.allChecked) {
      this.selectedIds.clear();
      this.allChecked = false;
    } else {
      this.paginatedUsers.forEach(u => this.selectedIds.add(u.id));
      this.allChecked = true;
    }
  }
  toggleRow(id: number): void {
    this.selectedIds.has(id) ? this.selectedIds.delete(id) : this.selectedIds.add(id);
    this.allChecked = this.paginatedUsers.every(u => this.selectedIds.has(u.id));
  }
  isSelected(id: number): boolean { return this.selectedIds.has(id); }

  clearSelection(): void { this.selectedIds.clear(); this.allChecked = false; }

  /* ── Pagination ── */
  goPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.allChecked = false; }
  }
  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  /* ── Drawer ── */
  openDrawer(user: User): void { this.drawerUser = user; this.drawerOpen = true; this.openMenuId = null; }
  closeDrawer(): void { this.drawerOpen = false; this.drawerUser = null; }

  /* ── Row actions menu ── */
  toggleMenu(id: number, event: Event): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }
}
