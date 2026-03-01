import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent {
  readinessScore = 62;
  circumference = 2 * Math.PI * 50;            // ≈ 314.16
  get dashOffset(): number {
    return this.circumference * (1 - this.readinessScore / 100);
  }

  statCards = [
    {
      label: 'Interview Sessions',
      value: '4',
      trend: '+2 this week',
      up: true,
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
    },
    {
      label: 'Roadmap Progress',
      value: '67%',
      trend: '+8%',
      up: true,
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
    },
    {
      label: 'Skills Acquired',
      value: '12',
      trend: '+3 new',
      up: true,
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
    },
    {
      label: 'Applications Sent',
      value: '3',
      trend: '-1',
      up: false,
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>'
    }
  ];

  recommendations = [
    { priority: 'High', badgeColor: '#ef4444', title: 'Complete Docker Fundamentals', desc: 'Critical skill gap for your target DevOps role.', time: '2h ago' },
    { priority: 'Medium', badgeColor: '#f59e0b', title: 'Practice System Design Interview', desc: 'Schedule a mock session to improve your score.', time: '5h ago' },
    { priority: 'High', badgeColor: '#ef4444', title: 'Update your CV summary section', desc: 'AI detected outdated experience section.', time: '1d ago' },
    { priority: 'Low', badgeColor: '#6366f1', title: 'Explore new job matches', desc: '3 new openings match your profile.', time: '2d ago' }
  ];

  skills = [
    { name: 'JavaScript', pct: 78, color: '#f59e0b' },
    { name: 'Docker', pct: 34, color: '#ef4444' },
    { name: 'System Design', pct: 45, color: '#f97316' },
    { name: 'SQL', pct: 82, color: '#2ee8a5' },
    { name: 'TypeScript', pct: 61, color: '#3b82f6' }
  ];

  upcomingSteps = [
    { text: 'Complete Docker module 3/5', due: 'Due tomorrow', done: false },
    { text: 'Take JavaScript assessment', due: 'Due in 3 days', done: false },
    { text: 'Review CV with AI feedback', due: 'Due next week', done: true }
  ];

  streakDays = 5;
  weekDays = [
    { day: 'Mon', active: true, today: false },
    { day: 'Tue', active: true, today: false },
    { day: 'Wed', active: true, today: false },
    { day: 'Thu', active: true, today: false },
    { day: 'Fri', active: true, today: true },
    { day: 'Sat', active: false, today: false },
    { day: 'Sun', active: false, today: false }
  ];

  activities = [
    { text: 'Completed "Intro to Docker" lesson', time: '10 min ago', color: '#2ee8a5' },
    { text: 'Scored 8.4/10 on mock interview', time: '1 hour ago', color: '#8b5cf6' },
    { text: 'Updated profile skills section', time: '3 hours ago', color: '#3b82f6' },
    { text: 'Applied to Frontend Dev @ Spotify', time: 'Yesterday', color: '#f59e0b' },
    { text: 'Completed TypeScript assessment', time: '2 days ago', color: '#6366f1' }
  ];
}
