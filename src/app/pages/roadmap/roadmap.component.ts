import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { CareerGridComponent } from './career-grid/career-grid.component';
import { CareerDetailComponent } from './career-detail/career-detail.component';

export interface CareerStep {
  id: number;
  title: string;
  major: boolean;
  done: boolean;
  desc: string;
  resources: string[];
}

export interface Career {
  id: string;
  name: string;
  icon: string;
  emojiSteps: string[];
  color: string;
  time: string;
  steps: CareerStep[];
}

const CAREERS_SEED: Career[] = [
  {
    id: 'ai',
    name: 'AI Engineer',
    icon: '🤖',
    emojiSteps: ['📐', '🐍', '🧠', '🔮', '💬', '🚀', '🏆'],
    color: '#00d4ff',
    time: '8–12 months',
    steps: [
      { id: 1, title: 'Math Foundations', major: true, done: false, desc: 'Linear algebra, calculus, probability, and statistics.', resources: ['Khan Academy', 'MIT 18.06', '3Blue1Brown'] },
      { id: 2, title: 'Python & NumPy', major: false, done: false, desc: 'Data wrangling and analysis with Python tooling.', resources: ['Kaggle Python', 'CS50P', 'Real Python'] },
      { id: 3, title: 'ML Basics', major: true, done: false, desc: 'Core supervised and unsupervised learning patterns.', resources: ['Andrew Ng Coursera', 'Hands-On ML', 'fast.ai'] },
      { id: 4, title: 'Deep Learning', major: false, done: false, desc: 'Neural nets and modern model architectures.', resources: ['fast.ai DL', 'DL Specialization', 'PyTorch docs'] },
      { id: 5, title: 'NLP & LLMs', major: true, done: false, desc: 'Transformers, prompt design, and LLM workflows.', resources: ['HuggingFace', 'Attention Paper', 'LangChain'] },
      { id: 6, title: 'MLOps', major: false, done: false, desc: 'Model deployment, observability, and operations.', resources: ['Full Stack DL', 'MLflow docs', 'Made With ML'] },
      { id: 7, title: 'Portfolio Projects', major: true, done: false, desc: 'Build production-ready AI projects end to end.', resources: ['Kaggle', 'Papers With Code', 'GitHub'] }
    ]
  },
  {
    id: 'cloud',
    name: 'Cloud Engineer',
    icon: '☁️',
    emojiSteps: ['🐧', '⚡', '🏗️', '📦', '🔄', '🛡️', '🎓'],
    color: '#ff6b00',
    time: '6–10 months',
    steps: [
      { id: 1, title: 'Linux & Networking', major: true, done: false, desc: 'Core Linux, TCP/IP, DNS, and firewall concepts.', resources: ['Linux Journey', 'Professor Messer', 'TryHackMe'] },
      { id: 2, title: 'AWS Fundamentals', major: false, done: false, desc: 'EC2, IAM, VPC, storage, and cloud architecture.', resources: ['AWS Skill Builder', 'A Cloud Guru', 'Stephane Maarek'] },
      { id: 3, title: 'Infrastructure as Code', major: true, done: false, desc: 'Terraform and repeatable infra workflows.', resources: ['HashiCorp Learn', 'Terraform docs', 'IaC Guides'] },
      { id: 4, title: 'Containers & K8s', major: false, done: false, desc: 'Container orchestration and deployment patterns.', resources: ['KodeKloud', 'Play with K8s', 'CKA prep'] },
      { id: 5, title: 'CI/CD Pipelines', major: true, done: false, desc: 'Automated delivery with robust release flow.', resources: ['GitHub Actions', 'Jenkins', 'ArgoCD'] },
      { id: 6, title: 'Cloud Security', major: false, done: false, desc: 'Identity boundaries, encryption, and compliance.', resources: ['AWS Security', 'CSA', 'KodeKloud'] },
      { id: 7, title: 'Multi-cloud & Certs', major: true, done: false, desc: 'Production readiness and certification mastery.', resources: ['AWS Guide', 'ExamPro', 'TutorialsDojo'] }
    ]
  },
  {
    id: 'devops',
    name: 'DevOps Engineer',
    icon: '⚙️',
    emojiSteps: ['🌿', '📜', '🔁', '📊', '🐳', '☁️', '🔥'],
    color: '#a855f7',
    time: '8–12 months',
    steps: [
      { id: 1, title: 'Version Control', major: true, done: false, desc: 'Branching discipline and collaboration at scale.', resources: ['Pro Git', 'Atlassian Git', 'GitHub Lab'] },
      { id: 2, title: 'Scripting', major: false, done: false, desc: 'Automate repetitive tasks with shell and Python.', resources: ['ShellCheck', 'Automate with Python', 'Bash Tutorial'] },
      { id: 3, title: 'CI/CD Pipelines', major: true, done: false, desc: 'Build, test, and release with confidence.', resources: ['Jenkins', 'CircleCI', 'GitHub Actions'] },
      { id: 4, title: 'Monitoring & Logging', major: false, done: false, desc: 'Observability stacks and actionable alerting.', resources: ['Prometheus', 'Grafana', 'Elastic'] },
      { id: 5, title: 'Docker & K8s', major: true, done: false, desc: 'Container lifecycle and orchestration strategy.', resources: ['Docker docs', 'KodeKloud', 'CKAD prep'] },
      { id: 6, title: 'Cloud Platforms', major: false, done: false, desc: 'AWS/GCP primitives and production deployment.', resources: ['AWS Free Tier', 'Qwiklabs', 'Cloud Guru'] },
      { id: 7, title: 'SRE Practices', major: true, done: false, desc: 'Reliability targets and incident command.', resources: ['Google SRE Book', 'Gremlin', 'PagerDuty'] }
    ]
  },
  {
    id: 'frontend',
    name: 'Frontend Engineer',
    icon: '🎨',
    emojiSteps: ['🖼️', '⚡', '⚛️', '🔷', '🧪', '♿', '🚢'],
    color: '#ec4899',
    time: '5–8 months',
    steps: [
      { id: 1, title: 'HTML & CSS', major: true, done: false, desc: 'Layout, semantics, and responsive foundations.', resources: ['MDN', 'freeCodeCamp', 'Kevin Powell'] },
      { id: 2, title: 'JavaScript Core', major: false, done: false, desc: 'Language fluency, async flow, and DOM APIs.', resources: ['javascript.info', 'Eloquent JS', 'FCC JS'] },
      { id: 3, title: 'Framework Mastery', major: true, done: false, desc: 'Component architecture and app state design.', resources: ['React docs', 'Angular docs', 'Scrimba'] },
      { id: 4, title: 'TypeScript', major: false, done: false, desc: 'Type-safe UI systems with maintainable contracts.', resources: ['TS Handbook', 'Execute Program', 'Matt Pocock'] },
      { id: 5, title: 'Testing', major: true, done: false, desc: 'UI confidence with unit and E2E strategy.', resources: ['Testing Library', 'Cypress', 'Kent C. Dodds'] },
      { id: 6, title: 'Performance & A11y', major: false, done: false, desc: 'Vitals, accessibility, and production polish.', resources: ['web.dev', 'WCAG', 'Lighthouse CI'] },
      { id: 7, title: 'Ship Projects', major: true, done: false, desc: 'Deploy and present polished portfolio products.', resources: ['Frontend Mentor', 'Vercel', 'Netlify'] }
    ]
  },
  {
    id: 'backend',
    name: 'Backend Engineer',
    icon: '🛠️',
    emojiSteps: ['💻', '🌐', '🗄️', '🔐', '🏛️', '🧪', '🚀'],
    color: '#22c55e',
    time: '7–10 months',
    steps: [
      { id: 1, title: 'Programming Language', major: true, done: false, desc: 'Choose one backend language and go deep.', resources: ['Node docs', 'Python.org', 'MOOC.fi Java'] },
      { id: 2, title: 'REST APIs', major: false, done: false, desc: 'HTTP contracts, handlers, and API discipline.', resources: ['REST API Tutorial', 'FastAPI docs', 'Postman'] },
      { id: 3, title: 'Databases', major: true, done: false, desc: 'Relational plus document data strategy.', resources: ['PostgreSQL', 'MongoDB University', 'SQLZoo'] },
      { id: 4, title: 'Auth & Security', major: false, done: false, desc: 'Identity, tokens, and OWASP safeguards.', resources: ['OWASP', 'Auth0', 'PassportJS'] },
      { id: 5, title: 'System Design Basics', major: true, done: false, desc: 'Scalable architecture and resilient patterns.', resources: ['System Design Primer', 'ByteByteGo', 'DDIA'] },
      { id: 6, title: 'Testing & Docs', major: false, done: false, desc: 'Reliable delivery with tests and API docs.', resources: ['Jest', 'Supertest', 'Swagger'] },
      { id: 7, title: 'Deploy & Scale', major: true, done: false, desc: 'Deploy, monitor, and scale backend services.', resources: ['Railway', 'Render', '12 Factor App'] }
    ]
  },
  {
    id: 'security',
    name: 'Security Engineer',
    icon: '🔒',
    emojiSteps: ['🌐', '🐧', '🛡️', '⚔️', '🕷️', '🔵', '🏅'],
    color: '#f59e0b',
    time: '9–14 months',
    steps: [
      { id: 1, title: 'Networking Fundamentals', major: true, done: false, desc: 'Network protocols, segmentation, and traffic flow.', resources: ['Professor Messer', 'CompTIA Net+', 'TryHackMe'] },
      { id: 2, title: 'Linux & CLI', major: false, done: false, desc: 'Shell command fluency and host hardening basics.', resources: ['OverTheWire', 'Linux Journey', 'TryHackMe Linux'] },
      { id: 3, title: 'CompTIA Security+', major: true, done: false, desc: 'Threats, cryptography, and security baseline.', resources: ['Messer Sec+', 'Darril Gibson', 'ExamCram'] },
      { id: 4, title: 'Ethical Hacking', major: false, done: false, desc: 'Recon workflows and practical attack simulation.', resources: ['TryHackMe', 'HackTheBox', 'TCM Security'] },
      { id: 5, title: 'Web App Security', major: true, done: false, desc: 'OWASP risks and secure web exploitation skills.', resources: ['PortSwigger', 'WebGoat', 'Burp docs'] },
      { id: 6, title: 'Blue Team & SOC', major: false, done: false, desc: 'Monitoring, detection, and incident handling.', resources: ['Splunk', 'LetsDefend', 'Blue Team Labs'] },
      { id: 7, title: 'Certs & CTFs', major: true, done: false, desc: 'Certification path and challenge-based mastery.', resources: ['CTFtime', 'eJPT', 'HTB Academy'] }
    ]
  }
];

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule, CareerGridComponent, CareerDetailComponent],
  templateUrl: './roadmap.component.html',
  styleUrl: './roadmap.component.scss'
})
export class RoadmapComponent {
  readonly careers = signal<Career[]>(this.cloneCareers(CAREERS_SEED));
  readonly selectedCareer = signal<Career | null>(null);

  readonly trackCount = computed(() => this.careers().length);
  readonly milestoneCount = computed(() => this.careers().reduce((acc, career) => acc + career.steps.length, 0));
  readonly completedSteps = computed(() => {
    return this.careers().reduce((acc, career) => {
      return acc + career.steps.filter((step) => step.done).length;
    }, 0);
  });

  selectCareer(career: Career): void {
    const selected = this.careers().find((item) => item.id === career.id) ?? null;
    this.selectedCareer.set(selected);
  }

  goBack(): void {
    this.selectedCareer.set(null);
  }

  toggleStepCompletion(stepId: number): void {
    const active = this.selectedCareer();
    if (!active) {
      return;
    }

    this.careers.update((careers) => {
      return careers.map((career) => {
        if (career.id !== active.id) {
          return career;
        }

        const updatedSteps = career.steps.map((step) => {
          if (step.id !== stepId) {
            return step;
          }

          return { ...step, done: !step.done };
        });

        return {
          ...career,
          steps: updatedSteps
        };
      });
    });

    const refreshed = this.careers().find((career) => career.id === active.id) ?? null;
    this.selectedCareer.set(refreshed);
  }

  private cloneCareers(seed: Career[]): Career[] {
    return seed.map((career) => ({
      ...career,
      emojiSteps: [...career.emojiSteps],
      steps: career.steps.map((step) => ({ ...step }))
    }));
  }
}
