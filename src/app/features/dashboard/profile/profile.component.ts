import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type ProfileTab = 'overview' | 'experience' | 'projects' | 'assessments';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  activeTab = signal<ProfileTab>('overview');
  tabs: { id: ProfileTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'assessments', label: 'Assessments' },
  ];

  ringCircum = 2 * Math.PI * 42;

  /* ── Skills ── */
  skillGroups = [
    { category: 'Frontend', skills: [
      { name: 'Angular', level: 88 },
      { name: 'React', level: 72 },
      { name: 'TypeScript', level: 90 },
    ]},
    { category: 'Backend', skills: [
      { name: 'Node.js', level: 82 },
      { name: 'Python', level: 60 },
      { name: 'PostgreSQL', level: 75 },
    ]},
    { category: 'DevOps', skills: [
      { name: 'Docker', level: 70 },
      { name: 'AWS', level: 55 },
      { name: 'CI/CD', level: 65 },
    ]},
  ];

  /* ── Badges ── */
  badges = [
    { name: 'Early Adopter', icon: '🚀' },
    { name: 'Code Streak 30', icon: '🔥' },
    { name: 'Quiz Master', icon: '🧠' },
    { name: 'Profile Complete', icon: '✅' },
    { name: 'Open Source', icon: '💎' },
    { name: 'Team Player', icon: '🤝' },
  ];

  /* ── GitHub data ── */
  languages = [
    { name: 'TypeScript', pct: 42, color: '#3178c6' },
    { name: 'Python', pct: 22, color: '#3572A5' },
    { name: 'JavaScript', pct: 18, color: '#f1e05a' },
    { name: 'SCSS', pct: 10, color: '#c6538c' },
    { name: 'Go', pct: 8, color: '#00ADD8' },
  ];

  topRepos = [
    { name: 'smarthire-platform', stars: 234, lang: 'TypeScript', color: '#3178c6' },
    { name: 'devsync-editor', stars: 189, lang: 'TypeScript', color: '#3178c6' },
    { name: 'ml-pipeline-utils', stars: 97, lang: 'Python', color: '#3572A5' },
    { name: 'infra-terraform', stars: 54, lang: 'Go', color: '#00ADD8' },
  ];

  /* ── LinkedIn scores ── */
  linkedinScores = [
    { section: 'Headline', score: 90 },
    { section: 'Summary', score: 78 },
    { section: 'Experience', score: 85 },
    { section: 'Skills', score: 65 },
    { section: 'Education', score: 92 },
  ];

  /* ── Experience ── */
  experiences = [
    {
      company: 'TechCorp',
      role: 'Software Engineer',
      dateRange: 'Mar 2023 – Present',
      bullets: [
        'Architected microservices processing 50k+ daily requests',
        'Led monolith-to-event-driven migration reducing latency 60%',
        'Reduced CI/CD pipeline time by 40% via parallel test execution',
      ],
    },
    {
      company: 'StartupXYZ',
      role: 'Junior Developer',
      dateRange: 'Jun 2021 – Feb 2023',
      bullets: [
        'Built RESTful APIs and React dashboards for internal tools',
        'Increased code coverage from 30% to 85% with automated tests',
        'Implemented OAuth2 login flow serving 12k+ users',
      ],
    },
    {
      company: 'University of Technology',
      role: 'Teaching Assistant — CS301',
      dateRange: 'Sep 2020 – May 2021',
      bullets: [
        'Led labs for Distributed Systems course (40 students)',
        'Authored automated grading scripts in Python',
      ],
    },
  ];

  /* ── Projects ── */
  projects = [
    { name: 'SmartHire Platform', techStack: ['Angular', 'NestJS', 'PostgreSQL', 'Docker'], aiScore: 88 },
    { name: 'DevSync Editor', techStack: ['TypeScript', 'WebSockets', 'OT', 'Redis'], aiScore: 82 },
    { name: 'ML Pipeline Utils', techStack: ['Python', 'PyTorch', 'FastAPI', 'Docker'], aiScore: 71 },
    { name: 'Infra Terraform Modules', techStack: ['Terraform', 'AWS', 'Go'], aiScore: 64 },
    { name: 'CLI Task Runner', techStack: ['Go', 'Cobra', 'SQLite'], aiScore: 52 },
    { name: 'Portfolio Site', techStack: ['Next.js', 'Tailwind', 'Vercel'], aiScore: 45 },
  ];

  /* ── Radar chart ── */
  radarAxes = [
    { label: 'Frontend', value: 85 },
    { label: 'Backend', value: 72 },
    { label: 'DevOps', value: 58 },
    { label: 'Algorithms', value: 65 },
    { label: 'Databases', value: 75 },
    { label: 'Soft Skills', value: 80 },
  ];

  get radarPoints(): string {
    return this.radarAxes.map((a, i) => {
      const x = 150 + a.value * 1.2 * this.cos(i);
      const y = 150 + a.value * 1.2 * this.sin(i);
      return `${x},${y}`;
    }).join(' ');
  }

  cos(i: number): number {
    return Math.cos(Math.PI * 2 * i / 6 - Math.PI / 2);
  }
  sin(i: number): number {
    return Math.sin(Math.PI * 2 * i / 6 - Math.PI / 2);
  }

  getHexPoints(cx: number, cy: number, r: number): string {
    return Array.from({ length: 6 }, (_, i) => {
      const x = cx + r * Math.cos(Math.PI * 2 * i / 6 - Math.PI / 2);
      const y = cy + r * Math.sin(Math.PI * 2 * i / 6 - Math.PI / 2);
      return `${x},${y}`;
    }).join(' ');
  }

  /* ── Score history ── */
  scoreHistory = [
    { date: 'Feb 20, 2026', score: 72 },
    { date: 'Jan 15, 2026', score: 65 },
    { date: 'Dec 10, 2025', score: 58 },
    { date: 'Nov 5, 2025', score: 52 },
    { date: 'Oct 1, 2025', score: 44 },
  ];
}
