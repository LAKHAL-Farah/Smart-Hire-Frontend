import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* ── Types ── */
interface Job {
  id: number;
  title: string;
  company: string;
  companyInitials: string;
  companyColor: string;
  verified: boolean;
  locationType: string;
  contractType: string;
  salaryRange: string;
  experienceLevel: string;
  skills: string[];
  matchScore: number;
  postedDate: string;
  description: string;
  saved: boolean;
}

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss'
})
export class JobsComponent {
  /* ── User's current skills (for match highlighting) ── */
  userSkills = ['TypeScript', 'Angular', 'Node.js', 'PostgreSQL', 'Docker', 'Python', 'React', 'AWS', 'Git', 'REST APIs'];

  /* ── Signals ── */
  selectedJobId = signal(1);
  breakdownOpen = signal(false);
  sortOption = 'match';
  searchQuery = '';
  techQuery = '';

  /* ── Filter state ── */
  locationFilters = signal<string[]>([]);
  contractFilters = signal<string[]>([]);
  experienceFilters = signal<string[]>([]);
  salaryMin = signal(0);
  salaryMax = signal(200000);
  techFilters = signal<string[]>([]);

  /* ── Filter options ── */
  locationOptions = ['Remote', 'Hybrid', 'On-site'];
  contractOptions = ['Internship', 'Full-time', 'Part-time', 'Freelance'];
  experienceOptions = ['Junior', 'Mid', 'Senior'];

  allTechOptions = [
    'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C++',
    'Angular', 'React', 'Vue', 'Svelte', 'Next.js', 'Node.js', 'NestJS', 'Express',
    'PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'GraphQL', 'REST APIs',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform',
    'Git', 'CI/CD', 'Linux', 'Kafka', 'RabbitMQ',
  ];

  /* ── Match ring math ── */
  matchCircum = 2 * Math.PI * 16; // ≈ 100.53

  /* ── Job data ── */
  allJobs: Job[] = [
    {
      id: 1,
      title: 'Senior Frontend Engineer',
      company: 'Spotify',
      companyInitials: 'SP',
      companyColor: '#1DB954',
      verified: true,
      locationType: 'Remote',
      contractType: 'Full-time',
      salaryRange: '$130k – $175k',
      experienceLevel: 'Senior',
      skills: ['TypeScript', 'React', 'GraphQL', 'Node.js', 'CI/CD', 'Docker'],
      matchScore: 82,
      postedDate: 'Feb 23, 2026',
      description: 'We are looking for a Senior Frontend Engineer to join the Web Player team at Spotify. You will architect and build high-performance UI components that serve millions of daily listeners.\nYou will collaborate with designers, backend engineers, and product managers to ship features across our desktop and web platforms. A strong understanding of state management, accessibility, and performance optimization is essential.\nThis is a fully remote position open to candidates across Europe and North America.',
      saved: false,
    },
    {
      id: 2,
      title: 'Full-Stack Developer',
      company: 'Stripe',
      companyInitials: 'ST',
      companyColor: '#635BFF',
      verified: true,
      locationType: 'Hybrid',
      contractType: 'Full-time',
      salaryRange: '$140k – $190k',
      experienceLevel: 'Senior',
      skills: ['TypeScript', 'React', 'Ruby', 'PostgreSQL', 'AWS', 'Kubernetes'],
      matchScore: 74,
      postedDate: 'Feb 21, 2026',
      description: 'Stripe is hiring a Full-Stack Developer to work on the Payments Dashboard. You will own features end-to-end, from database design through API development to polished frontend interfaces.\nOur stack includes React, TypeScript, Ruby on Rails, and PostgreSQL, all deployed on AWS with Kubernetes. You will also contribute to our internal design system and developer tools.\nHybrid role based in San Francisco or New York, with 3 days per week in-office.',
      saved: true,
    },
    {
      id: 3,
      title: 'Backend Engineer',
      company: 'Datadog',
      companyInitials: 'DD',
      companyColor: '#632CA6',
      verified: true,
      locationType: 'Remote',
      contractType: 'Full-time',
      salaryRange: '$120k – $160k',
      experienceLevel: 'Mid',
      skills: ['Go', 'Python', 'Kafka', 'PostgreSQL', 'Kubernetes', 'Terraform'],
      matchScore: 58,
      postedDate: 'Feb 19, 2026',
      description: 'Join Datadog as a Backend Engineer to build the next generation of our real-time monitoring pipeline. You will work on high-throughput distributed systems that process billions of events daily.\nThe ideal candidate has experience with Go, message queues (Kafka), and container orchestration. You will contribute to system design, performance profiling, and incident response.\nFully remote within the US and Canada.',
      saved: false,
    },
    {
      id: 4,
      title: 'Junior Frontend Developer',
      company: 'Figma',
      companyInitials: 'FG',
      companyColor: '#F24E1E',
      verified: false,
      locationType: 'On-site',
      contractType: 'Full-time',
      salaryRange: '$75k – $100k',
      experienceLevel: 'Junior',
      skills: ['TypeScript', 'React', 'CSS', 'REST APIs', 'Git'],
      matchScore: 88,
      postedDate: 'Feb 18, 2026',
      description: 'Figma is looking for a Junior Frontend Developer to join our growing Design Tools team. You will help build and maintain interactive UI components used by millions of designers and developers.\nYou should be comfortable with TypeScript, React, and modern CSS techniques. Experience with canvas rendering or WebGL is a plus, but not required.\nThis is an on-site position at our San Francisco office with excellent mentorship opportunities.',
      saved: false,
    },
    {
      id: 5,
      title: 'DevOps Engineer',
      company: 'GitLab',
      companyInitials: 'GL',
      companyColor: '#FC6D26',
      verified: true,
      locationType: 'Remote',
      contractType: 'Full-time',
      salaryRange: '$110k – $150k',
      experienceLevel: 'Mid',
      skills: ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'Linux', 'CI/CD', 'Python'],
      matchScore: 65,
      postedDate: 'Feb 17, 2026',
      description: 'GitLab seeks a DevOps Engineer to improve our cloud infrastructure and deployment pipelines. You will automate provisioning, enhance monitoring, and ensure high reliability across all production services.\nExperience with Terraform, Kubernetes, and at least one major cloud provider is required. We are a fully remote company with asynchronous communication at its core.\nThis role offers significant autonomy and the opportunity to work across many engineering teams.',
      saved: false,
    },
    {
      id: 6,
      title: 'Software Engineer Intern',
      company: 'Vercel',
      companyInitials: 'VC',
      companyColor: '#000',
      verified: false,
      locationType: 'Remote',
      contractType: 'Internship',
      salaryRange: '$4k – $6k/mo',
      experienceLevel: 'Junior',
      skills: ['TypeScript', 'Next.js', 'React', 'Node.js', 'Git'],
      matchScore: 71,
      postedDate: 'Feb 15, 2026',
      description: 'Vercel is offering a summer internship for aspiring Software Engineers. You will work alongside our platform team to build tooling that empowers frontend developers around the world.\nIdeal candidates are comfortable with TypeScript and Next.js, and have a passion for developer experience. You will ship real features used by hundreds of thousands of developers.\nFully remote internship, 12 weeks, with mentorship from senior engineers.',
      saved: false,
    },
    {
      id: 7,
      title: 'AI/ML Engineer',
      company: 'OpenAI',
      companyInitials: 'OA',
      companyColor: '#10a37f',
      verified: true,
      locationType: 'Hybrid',
      contractType: 'Full-time',
      salaryRange: '$180k – $250k',
      experienceLevel: 'Senior',
      skills: ['Python', 'PyTorch', 'Kubernetes', 'AWS', 'C++', 'Linux'],
      matchScore: 42,
      postedDate: 'Feb 14, 2026',
      description: 'OpenAI is hiring an AI/ML Engineer to push the boundaries of large language models. You will design and train models at scale, optimize inference performance, and contribute to safety research.\nStrong experience with Python, PyTorch, and distributed training is essential. Familiarity with CUDA, C++, and ML systems engineering is highly valued.\nHybrid role based in San Francisco with flexible remote days.',
      saved: false,
    },
    {
      id: 8,
      title: 'Freelance React Developer',
      company: 'Toptal',
      companyInitials: 'TT',
      companyColor: '#204ECF',
      verified: false,
      locationType: 'Remote',
      contractType: 'Freelance',
      salaryRange: '$70 – $120/hr',
      experienceLevel: 'Mid',
      skills: ['React', 'TypeScript', 'Node.js', 'REST APIs', 'MongoDB', 'Git'],
      matchScore: 79,
      postedDate: 'Feb 12, 2026',
      description: 'Toptal is looking for skilled React Developers to join our freelance network and work with Fortune 500 clients. Projects range from greenfield applications to complex platform migrations.\nYou should have at least 3 years of professional React experience and strong communication skills. TypeScript proficiency and Node.js backend knowledge are a plus.\nFlexible hours, fully remote, choose your own projects.',
      saved: false,
    },
  ];

  /* ── Computed ── */
  filteredJobs = computed(() => {
    let jobs = [...this.allJobs];

    // Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.skills.some(s => s.toLowerCase().includes(q))
      );
    }

    // Location
    const locs = this.locationFilters();
    if (locs.length) jobs = jobs.filter(j => locs.includes(j.locationType));

    // Contract
    const ctrs = this.contractFilters();
    if (ctrs.length) jobs = jobs.filter(j => ctrs.includes(j.contractType));

    // Experience
    const exps = this.experienceFilters();
    if (exps.length) jobs = jobs.filter(j => exps.includes(j.experienceLevel));

    // Tech stack
    const techs = this.techFilters();
    if (techs.length) jobs = jobs.filter(j => techs.some(t => j.skills.includes(t)));

    // Sort
    if (this.sortOption === 'match') {
      jobs.sort((a, b) => b.matchScore - a.matchScore);
    } else if (this.sortOption === 'recent') {
      jobs.sort((a, b) => b.id - a.id);
    }

    return jobs;
  });

  selectedJob = computed(() => {
    return this.allJobs.find(j => j.id === this.selectedJobId()) ?? this.allJobs[0];
  });

  techSuggestions = computed(() => {
    const q = this.techQuery.toLowerCase().trim();
    if (!q) return [];
    const active = this.techFilters();
    return this.allTechOptions
      .filter(t => t.toLowerCase().includes(q) && !active.includes(t))
      .slice(0, 6);
  });

  /* ── Methods ── */
  toggleFilter(type: 'location' | 'contract' | 'experience', value: string): void {
    const sigMap = {
      location: this.locationFilters,
      contract: this.contractFilters,
      experience: this.experienceFilters,
    };
    const sig = sigMap[type];
    const current = sig();
    if (current.includes(value)) {
      sig.set(current.filter(v => v !== value));
    } else {
      sig.set([...current, value]);
    }
  }

  onSalaryMinChange(val: number): void {
    if (val <= this.salaryMax()) this.salaryMin.set(val);
  }

  onSalaryMaxChange(val: number): void {
    if (val >= this.salaryMin()) this.salaryMax.set(val);
  }

  addTechTag(): void {
    const q = this.techQuery.trim();
    if (!q) return;
    const match = this.allTechOptions.find(t => t.toLowerCase() === q.toLowerCase());
    if (match && !this.techFilters().includes(match)) {
      this.techFilters.set([...this.techFilters(), match]);
    }
    this.techQuery = '';
  }

  pickTechTag(tag: string): void {
    if (!this.techFilters().includes(tag)) {
      this.techFilters.set([...this.techFilters(), tag]);
    }
    this.techQuery = '';
  }

  removeTechTag(tag: string): void {
    this.techFilters.set(this.techFilters().filter(t => t !== tag));
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.locationFilters.set([]);
    this.contractFilters.set([]);
    this.experienceFilters.set([]);
    this.salaryMin.set(0);
    this.salaryMax.set(200000);
    this.techFilters.set([]);
    this.techQuery = '';
  }

  applySearch(): void {
    // Filters are reactive — this is a no-op trigger if needed
  }

  toggleSave(job: Job, event: Event): void {
    event.stopPropagation();
    job.saved = !job.saved;
  }

  getMatchedSkills(job: Job): string[] {
    return job.skills.filter(s => this.userSkills.includes(s));
  }

  getMissingSkills(job: Job): string[] {
    return job.skills.filter(s => !this.userSkills.includes(s));
  }
}
