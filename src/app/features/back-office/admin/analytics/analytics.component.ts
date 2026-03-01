import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';

interface CohortRow {
  month: string;
  retention: number[];   // Month 0 through Month 12
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, LUCIDE_ICONS],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent {

  /* ── Date Range ── */
  dateRange = 'Last 30 days';
  dateRanges = ['Last 7 days', 'Last 30 days', 'Last 90 days'];

  /* ══════════ SUMMARY CARDS ══════════ */
  mrr = 84_250;
  mrrChange = 6.8;
  totalActiveUsers = 12_487;
  dailyActives = [820, 910, 780, 1040, 1120, 980, 870, 1200, 1150, 1080, 950, 1310, 1260, 1180];
  churnRate = 4.2;
  churnTrend = 0.3; // positive = increasing = bad

  get maxDaily(): number { return Math.max(...this.dailyActives); }

  /* ══════════ DONUT — User Acquisition ══════════ */
  acquisitionChannels = [
    { label: 'Direct',         value: 3840, color: '#2ee8a5' },
    { label: 'Google OAuth',   value: 3120, color: '#0ea5e9' },
    { label: 'GitHub OAuth',   value: 2480, color: '#a78bfa' },
    { label: 'LinkedIn OAuth', value: 1640, color: '#fbbf24' },
    { label: 'Microsoft SSO',  value: 890,  color: '#f97316' },
    { label: 'Referral',       value: 517,  color: '#ec4899' },
  ];

  get acquisitionTotal(): number {
    return this.acquisitionChannels.reduce((s, c) => s + c.value, 0);
  }

  getDonutSegments(): { offset: number; dashArray: string; color: string }[] {
    const circumference = 2 * Math.PI * 70; // r=70
    let offset = 0;
    return this.acquisitionChannels.map(c => {
      const pct = c.value / this.acquisitionTotal;
      const seg = { offset, dashArray: `${pct * circumference} ${circumference}`, color: c.color };
      offset += pct * circumference;
      return seg;
    });
  }

  /* ══════════ HEATMAP — Feature Usage ══════════ */
  heatmapModules = ['Assessment', 'Interview', 'CV Optimizer', 'Job Board', 'Roadmap', 'Profile', 'Settings'];
  heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  heatmapData: number[][] = [
    // Assessment
    [72, 68, 75, 80, 65, 45, 38],
    // Interview
    [40, 45, 42, 50, 55, 70, 92],
    // CV Optimizer
    [60, 55, 58, 62, 50, 30, 25],
    // Job Board
    [95, 82, 78, 85, 70, 42, 35],
    // Roadmap
    [55, 58, 52, 60, 48, 65, 70],
    // Profile
    [30, 28, 32, 35, 25, 20, 18],
    // Settings
    [15, 12, 18, 14, 10, 8, 6],
  ];

  getHeatmapOpacity(value: number): number {
    return Math.max(0.08, value / 100);
  }

  /* ══════════ HISTOGRAM — Assessment Scores ══════════ */
  scoreBuckets = [
    { range: '0-10',   count: 45 },
    { range: '11-20',  count: 120 },
    { range: '21-30',  count: 285 },
    { range: '31-40',  count: 580 },
    { range: '41-50',  count: 1120 },
    { range: '51-60',  count: 2340 },
    { range: '61-70',  count: 3180 },
    { range: '71-80',  count: 2860 },
    { range: '81-90',  count: 1540 },
    { range: '91-100', count: 418 },
  ];
  averageScore = 64.7;
  get maxBucket(): number { return Math.max(...this.scoreBuckets.map(b => b.count)); }
  get avgBarPosition(): number { return (this.averageScore / 100) * 100; }

  /* ══════════ FUNNEL — Subscription Conversion ══════════ */
  funnelSteps = [
    { label: 'Registered',           count: 12487, color: '#2ee8a5' },
    { label: 'Completed Assessment', count: 8340,  color: '#0ea5e9' },
    { label: 'Used Interview',       count: 4120,  color: '#a78bfa' },
    { label: 'Converted to Premium', count: 1860,  color: '#fbbf24' },
  ];

  getFunnelWidth(count: number): number {
    return (count / this.funnelSteps[0].count) * 100;
  }
  getFunnelDropoff(i: number): number {
    if (i === 0) return 100;
    return Math.round((this.funnelSteps[i].count / this.funnelSteps[i - 1].count) * 100);
  }

  /* ══════════ COHORT RETENTION ══════════ */
  cohortMonths = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
  cohorts: CohortRow[] = [
    { month: 'Jan 2024', retention: [100, 78, 64, 55, 48, 42, 38, 35, 32, 30, 28, 27, 26] },
    { month: 'Feb 2024', retention: [100, 80, 67, 58, 50, 44, 40, 37, 34, 31, 29, 28, 0] },
    { month: 'Mar 2024', retention: [100, 82, 70, 61, 53, 46, 42, 38, 35, 33, 30, 0, 0] },
    { month: 'Apr 2024', retention: [100, 76, 62, 52, 45, 39, 35, 32, 29, 27, 0, 0, 0] },
    { month: 'May 2024', retention: [100, 84, 72, 63, 55, 48, 43, 40, 36, 0, 0, 0, 0] },
    { month: 'Jun 2024', retention: [100, 81, 68, 59, 51, 44, 40, 37, 0, 0, 0, 0, 0] },
    { month: 'Jul 2024', retention: [100, 79, 65, 56, 49, 42, 38, 0, 0, 0, 0, 0, 0] },
    { month: 'Aug 2024', retention: [100, 83, 71, 62, 54, 47, 0, 0, 0, 0, 0, 0, 0] },
    { month: 'Sep 2024', retention: [100, 77, 63, 54, 46, 0, 0, 0, 0, 0, 0, 0, 0] },
    { month: 'Oct 2024', retention: [100, 85, 73, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { month: 'Nov 2024', retention: [100, 80, 66, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { month: 'Dec 2024', retention: [100, 82, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  ];

  getCohortColor(value: number): string {
    if (value === 0) return 'transparent';
    if (value >= 70) return 'rgba(34,197,94,.55)';
    if (value >= 50) return 'rgba(46,232,165,.35)';
    if (value >= 35) return 'rgba(245,158,11,.3)';
    if (value >= 20) return 'rgba(249,115,22,.35)';
    return 'rgba(239,68,68,.3)';
  }
  getCohortTextColor(value: number): string {
    if (value === 0) return 'rgba(255,255,255,.15)';
    if (value >= 70) return '#4ade80';
    if (value >= 50) return '#2ee8a5';
    if (value >= 35) return '#fbbf24';
    if (value >= 20) return '#fb923c';
    return '#f87171';
  }
}
