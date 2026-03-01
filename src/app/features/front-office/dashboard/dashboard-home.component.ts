import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS } from '../../../shared/lucide-icons';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, LUCIDE_ICONS],
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
      icon: 'users'
    },
    {
      label: 'Roadmap Progress',
      value: '67%',
      trend: '+8%',
      up: true,
      icon: 'activity'
    },
    {
      label: 'Skills Acquired',
      value: '12',
      trend: '+3 new',
      up: true,
      icon: 'star'
    },
    {
      label: 'Applications Sent',
      value: '3',
      trend: '-1',
      up: false,
      icon: 'send'
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
