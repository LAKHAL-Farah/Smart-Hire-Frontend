import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* ══════════ INTERFACES ══════════ */

interface Resource {
  url: string;
  title: string;
  type: 'Video' | 'Article' | 'Course' | 'Docs';
  free: boolean;
}

interface RoadmapStep {
  id: number;
  title: string;
  description: string;
  estimatedHours: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  resources: Resource[];
  expanded: boolean;
}

interface PathSkill {
  name: string;
  category: string;
  importance: 'Required' | 'Preferred' | 'Optional';
  weight: number;
}

interface InterviewQ {
  id: number;
  text: string;
  category: 'Technical' | 'Behavioral' | 'System Design';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

interface SkillGap {
  skill: string;
  requiredByJobs: number;   // percentage
  covered: boolean;
  priority: 'High' | 'Medium' | 'Low';
}

interface ActiveJob {
  company: string;
  title: string;
  id: number;
}

interface StepCompletion {
  step: string;
  pct: number;
  sharp: boolean;
}

interface CareerPath {
  id: number;
  emoji: string;
  name: string;
  status: 'Published' | 'Draft';
  enrolled: number;
  stepsCount: number;
  skillsCount: number;
  avgCompletion: number;
  description: string;
  targetRoles: string[];
  salaryMin: number;
  salaryMax: number;
  difficulty: number;         // 1-5
  estimatedWeeks: number;
  hoursPerWeek: number;
  showInOnboarding: boolean;
  showInExplorer: boolean;
  showInAI: boolean;
  createdAt: string;

  skills: PathSkill[];
  roadmapSteps: RoadmapStep[];
  interviewQuestions: InterviewQ[];

  /* Job Alignment */
  marketDemand: { skill: string; demand: number; covered: number }[];
  skillGaps: SkillGap[];
  activeJobs: ActiveJob[];

  /* Analytics */
  totalEnrolled: number;
  activeThisMonth: number;
  avgCompletionRate: number;
  dropoutStep: number;
  dropoutStepName: string;
  enrollmentWeekly: number[];
  stepCompletions: StepCompletion[];
  scoreDistribution: number[];
  scoreBenchmark: number;
}

/* ══════════ SKILL CATALOG ══════════ */
interface CatalogSkill { name: string; category: string; }

@Component({
  selector: 'app-career-paths',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './career-paths.component.html',
  styleUrl: './career-paths.component.scss'
})
export class CareerPathsComponent {

  /* ── Search / Filter ── */
  listSearch = '';
  listFilter: 'All' | 'Draft' = 'All';

  /* ── Selected path ── */
  selectedPathId: number | null = null;
  editMode = false;
  activeTab = 'overview';
  tabs = ['Overview', 'Skills', 'Roadmap Steps', 'Interview Questions', 'Job Alignment', 'Analytics'];

  /* ── Skills tab ── */
  skillSearch = '';
  addSkillSearch = '';
  collapsedCategories = new Set<string>();
  showNewSkillForm = false;
  newSkillName = '';
  newSkillCategory = 'Frontend';
  newSkillDesc = '';
  skillCategories = ['Frontend', 'Backend', 'DevOps', 'Databases', 'Algorithms', 'Soft Skills'];

  /* ── Interview Questions tab ── */
  iqSearch = '';
  iqDiffFilter = 'All';
  showAddQuestionsModal = false;
  addQSearch = '';
  addQSelected = new Set<number>();

  /* ── Roadmap tab ── */
  editingStepId: number | null = null;

  /* ── Overview edit helpers ── */
  newRoleInput = '';

  /* ── Publish confirm ── */
  showPublishConfirm = false;

  /* ── Emoji picker ── */
  showEmojiPicker = false;
  emojis = ['💻', '🔧', '📊', '🎨', '🛡️', '📱', '☁️', '🤖', '🧪', '🗄️', '🌐', '🚀', '⚙️', '📈', '🧠'];

  /* ══════════ SKILL CATALOG ══════════ */
  globalSkillCatalog: CatalogSkill[] = [
    { name: 'JavaScript', category: 'Frontend' }, { name: 'TypeScript', category: 'Frontend' },
    { name: 'React', category: 'Frontend' }, { name: 'Angular', category: 'Frontend' },
    { name: 'Vue.js', category: 'Frontend' }, { name: 'CSS/SCSS', category: 'Frontend' },
    { name: 'HTML5', category: 'Frontend' }, { name: 'Tailwind CSS', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' }, { name: 'Python', category: 'Backend' },
    { name: 'Java', category: 'Backend' }, { name: 'Go', category: 'Backend' },
    { name: 'Rust', category: 'Backend' }, { name: 'C#', category: 'Backend' },
    { name: 'Ruby', category: 'Backend' }, { name: 'PHP', category: 'Backend' },
    { name: 'Docker', category: 'DevOps' }, { name: 'Kubernetes', category: 'DevOps' },
    { name: 'CI/CD', category: 'DevOps' }, { name: 'Terraform', category: 'DevOps' },
    { name: 'AWS', category: 'DevOps' }, { name: 'Azure', category: 'DevOps' },
    { name: 'PostgreSQL', category: 'Databases' }, { name: 'MongoDB', category: 'Databases' },
    { name: 'Redis', category: 'Databases' }, { name: 'MySQL', category: 'Databases' },
    { name: 'Data Structures', category: 'Algorithms' }, { name: 'Algorithms', category: 'Algorithms' },
    { name: 'System Design', category: 'Algorithms' }, { name: 'Big-O Analysis', category: 'Algorithms' },
    { name: 'Communication', category: 'Soft Skills' }, { name: 'Leadership', category: 'Soft Skills' },
    { name: 'Problem Solving', category: 'Soft Skills' }, { name: 'Agile/Scrum', category: 'Soft Skills' },
  ];

  /* ══════════ GLOBAL QUESTION BANK (for modal) ══════════ */
  globalQuestionBank: InterviewQ[] = [
    { id: 101, text: 'Explain closures in JavaScript and give a practical use case.', category: 'Technical', difficulty: 'Intermediate' },
    { id: 102, text: 'Design a distributed cache system with eviction policies.', category: 'System Design', difficulty: 'Expert' },
    { id: 103, text: 'Tell me about a time you resolved a conflict with a teammate.', category: 'Behavioral', difficulty: 'Beginner' },
    { id: 104, text: 'How does the event loop work in Node.js?', category: 'Technical', difficulty: 'Intermediate' },
    { id: 105, text: 'Design a URL shortener at scale.', category: 'System Design', difficulty: 'Advanced' },
    { id: 106, text: 'Describe a situation where you failed and what you learned.', category: 'Behavioral', difficulty: 'Beginner' },
    { id: 107, text: 'Explain the SOLID principles with examples.', category: 'Technical', difficulty: 'Intermediate' },
    { id: 108, text: 'What is the virtual DOM and how does React use it?', category: 'Technical', difficulty: 'Beginner' },
    { id: 109, text: 'Design a notification system that handles millions of users.', category: 'System Design', difficulty: 'Expert' },
    { id: 110, text: 'How do you handle scope creep in an agile environment?', category: 'Behavioral', difficulty: 'Intermediate' },
  ];

  /* ══════════ CAREER PATHS DATA ══════════ */
  paths: CareerPath[] = [
    {
      id: 1, emoji: '💻', name: 'Frontend Developer', status: 'Published',
      enrolled: 1240, stepsCount: 9, skillsCount: 12, avgCompletion: 34,
      description: 'Master modern frontend development from HTML/CSS fundamentals through advanced React and Angular frameworks. This path covers responsive design, state management, testing, and performance optimization to prepare candidates for junior to mid-level frontend positions.',
      targetRoles: ['Junior Frontend Developer', 'React Developer', 'UI Engineer', 'Web Developer'],
      salaryMin: 35000, salaryMax: 75000, difficulty: 3, estimatedWeeks: 14, hoursPerWeek: 10,
      showInOnboarding: true, showInExplorer: true, showInAI: true, createdAt: 'Oct 15, 2023',
      skills: [
        { name: 'JavaScript', category: 'Frontend', importance: 'Required', weight: 9 },
        { name: 'TypeScript', category: 'Frontend', importance: 'Required', weight: 8 },
        { name: 'React', category: 'Frontend', importance: 'Required', weight: 8 },
        { name: 'Angular', category: 'Frontend', importance: 'Preferred', weight: 6 },
        { name: 'CSS/SCSS', category: 'Frontend', importance: 'Required', weight: 7 },
        { name: 'HTML5', category: 'Frontend', importance: 'Required', weight: 7 },
        { name: 'Tailwind CSS', category: 'Frontend', importance: 'Preferred', weight: 5 },
        { name: 'Node.js', category: 'Backend', importance: 'Preferred', weight: 4 },
        { name: 'Data Structures', category: 'Algorithms', importance: 'Preferred', weight: 5 },
        { name: 'Algorithms', category: 'Algorithms', importance: 'Optional', weight: 3 },
        { name: 'Communication', category: 'Soft Skills', importance: 'Preferred', weight: 4 },
        { name: 'Problem Solving', category: 'Soft Skills', importance: 'Required', weight: 6 },
      ],
      roadmapSteps: [
        { id: 1, title: 'HTML & CSS Foundations', description: 'Learn semantic HTML, CSS layouts with Flexbox and Grid, and responsive design principles.', estimatedHours: 12, difficulty: 'Beginner', resources: [{ url: 'https://example.com', title: 'MDN Web Docs: HTML', type: 'Docs', free: true }, { url: 'https://example.com', title: 'CSS Grid Complete Guide', type: 'Article', free: true }], expanded: false },
        { id: 2, title: 'JavaScript Essentials', description: 'Master core JavaScript concepts including closures, prototypes, async/await, and the event loop.', estimatedHours: 20, difficulty: 'Beginner', resources: [{ url: 'https://example.com', title: 'JavaScript.info', type: 'Course', free: true }], expanded: false },
        { id: 3, title: 'TypeScript Deep Dive', description: 'Learn TypeScript type system, generics, interfaces, and advanced patterns.', estimatedHours: 14, difficulty: 'Intermediate', resources: [], expanded: false },
        { id: 4, title: 'React Fundamentals', description: 'Build components, manage state with hooks, handle routing, and integrate APIs.', estimatedHours: 18, difficulty: 'Intermediate', resources: [], expanded: false },
        { id: 5, title: 'State Management & Patterns', description: 'Redux, Context API, React Query, and common architecture patterns.', estimatedHours: 10, difficulty: 'Intermediate', resources: [], expanded: false },
        { id: 6, title: 'Testing & Quality', description: 'Unit testing with Jest, component testing with Testing Library, E2E with Cypress.', estimatedHours: 12, difficulty: 'Intermediate', resources: [], expanded: false },
        { id: 7, title: 'Angular Essentials', description: 'Components, services, dependency injection, RxJS, routing, and forms.', estimatedHours: 16, difficulty: 'Advanced', resources: [], expanded: false },
        { id: 8, title: 'Performance Optimization', description: 'Code splitting, lazy loading, memoization, web vitals.', estimatedHours: 8, difficulty: 'Advanced', resources: [], expanded: false },
        { id: 9, title: 'Portfolio & Interview Prep', description: 'Build portfolio projects, practice coding challenges, mock interviews.', estimatedHours: 14, difficulty: 'Advanced', resources: [], expanded: false },
      ],
      interviewQuestions: [
        { id: 1, text: 'Explain the difference between var, let, and const in JavaScript.', category: 'Technical', difficulty: 'Beginner' },
        { id: 2, text: 'What is the virtual DOM and how does React use it for efficient rendering?', category: 'Technical', difficulty: 'Intermediate' },
        { id: 3, text: 'Tell me about a time when you had to meet a tight deadline.', category: 'Behavioral', difficulty: 'Beginner' },
        { id: 4, text: 'Design a component library that can be shared across multiple projects.', category: 'System Design', difficulty: 'Advanced' },
      ],
      marketDemand: [
        { skill: 'React', demand: 92, covered: 88 }, { skill: 'JavaScript', demand: 88, covered: 90 },
        { skill: 'TypeScript', demand: 82, covered: 85 }, { skill: 'CSS/SCSS', demand: 75, covered: 80 },
        { skill: 'Next.js', demand: 68, covered: 10 }, { skill: 'Node.js', demand: 55, covered: 45 },
        { skill: 'GraphQL', demand: 42, covered: 5 }, { skill: 'Testing', demand: 65, covered: 70 },
        { skill: 'Git', demand: 80, covered: 0 }, { skill: 'CI/CD', demand: 38, covered: 0 },
      ],
      skillGaps: [
        { skill: 'Next.js', requiredByJobs: 68, covered: false, priority: 'High' },
        { skill: 'GraphQL', requiredByJobs: 42, covered: false, priority: 'Medium' },
        { skill: 'Git', requiredByJobs: 80, covered: false, priority: 'High' },
        { skill: 'CI/CD', requiredByJobs: 38, covered: false, priority: 'Low' },
        { skill: 'React', requiredByJobs: 92, covered: true, priority: 'Low' },
        { skill: 'TypeScript', requiredByJobs: 82, covered: true, priority: 'Low' },
      ],
      activeJobs: [
        { company: 'TechCorp', title: 'Junior React Developer', id: 1 },
        { company: 'StartupXYZ', title: 'Frontend Engineer', id: 2 },
        { company: 'DesignCo', title: 'UI Developer', id: 3 },
        { company: 'CloudBase', title: 'Web Application Developer', id: 4 },
        { company: 'FinTech Inc', title: 'React/TypeScript Developer', id: 5 },
      ],
      totalEnrolled: 1240, activeThisMonth: 348, avgCompletionRate: 34, dropoutStep: 4,
      dropoutStepName: 'React Fundamentals',
      enrollmentWeekly: [18, 22, 15, 28, 32, 24, 20, 35, 30, 27, 22, 38, 25],
      stepCompletions: [
        { step: 'HTML & CSS', pct: 92, sharp: false }, { step: 'JS Essentials', pct: 84, sharp: false },
        { step: 'TypeScript', pct: 71, sharp: false }, { step: 'React Fund.', pct: 48, sharp: true },
        { step: 'State Mgmt', pct: 38, sharp: false }, { step: 'Testing', pct: 30, sharp: false },
        { step: 'Angular', pct: 22, sharp: false }, { step: 'Performance', pct: 18, sharp: false },
        { step: 'Portfolio', pct: 14, sharp: false },
      ],
      scoreDistribution: [20, 65, 180, 310, 280, 210, 120, 45, 10],
      scoreBenchmark: 60,
    },
    {
      id: 2, emoji: '🔧', name: 'Backend Developer', status: 'Published',
      enrolled: 980, stepsCount: 10, skillsCount: 14, avgCompletion: 28,
      description: 'Build robust server-side applications with Node.js, Python, and databases. Covers API design, authentication, caching, message queues, and deployment to prepare candidates for backend engineering roles.',
      targetRoles: ['Backend Engineer', 'API Developer', 'Software Engineer', 'Node.js Developer'],
      salaryMin: 40000, salaryMax: 85000, difficulty: 4, estimatedWeeks: 16, hoursPerWeek: 10,
      showInOnboarding: true, showInExplorer: true, showInAI: true, createdAt: 'Nov 02, 2023',
      skills: [
        { name: 'Node.js', category: 'Backend', importance: 'Required', weight: 9 },
        { name: 'Python', category: 'Backend', importance: 'Preferred', weight: 7 },
        { name: 'PostgreSQL', category: 'Databases', importance: 'Required', weight: 8 },
        { name: 'MongoDB', category: 'Databases', importance: 'Preferred', weight: 6 },
        { name: 'Redis', category: 'Databases', importance: 'Preferred', weight: 5 },
        { name: 'Docker', category: 'DevOps', importance: 'Required', weight: 7 },
      ],
      roadmapSteps: [
        { id: 1, title: 'Node.js Core', description: 'Modules, streams, event loop, file system.', estimatedHours: 16, difficulty: 'Beginner', resources: [], expanded: false },
        { id: 2, title: 'Express & REST APIs', description: 'Build RESTful APIs with middleware, routing, and validation.', estimatedHours: 14, difficulty: 'Beginner', resources: [], expanded: false },
        { id: 3, title: 'Database Design', description: 'SQL, ORM, schema design, migrations, indexing.', estimatedHours: 18, difficulty: 'Intermediate', resources: [], expanded: false },
      ],
      interviewQuestions: [
        { id: 5, text: 'What is the event loop in Node.js?', category: 'Technical', difficulty: 'Intermediate' },
        { id: 6, text: 'Design a URL shortening service.', category: 'System Design', difficulty: 'Advanced' },
      ],
      marketDemand: [
        { skill: 'Node.js', demand: 85, covered: 80 }, { skill: 'Python', demand: 72, covered: 65 },
        { skill: 'PostgreSQL', demand: 68, covered: 70 }, { skill: 'Docker', demand: 60, covered: 55 },
      ],
      skillGaps: [
        { skill: 'Kubernetes', requiredByJobs: 45, covered: false, priority: 'Medium' },
        { skill: 'GraphQL', requiredByJobs: 38, covered: false, priority: 'Low' },
      ],
      activeJobs: [
        { company: 'DataFlow', title: 'Backend Engineer', id: 10 },
        { company: 'ScaleUp', title: 'Node.js Developer', id: 11 },
      ],
      totalEnrolled: 980, activeThisMonth: 245, avgCompletionRate: 28, dropoutStep: 3,
      dropoutStepName: 'Database Design',
      enrollmentWeekly: [14, 18, 12, 22, 25, 19, 16, 28, 24, 20, 17, 30, 21],
      stepCompletions: [
        { step: 'Node.js Core', pct: 88, sharp: false }, { step: 'Express', pct: 72, sharp: false },
        { step: 'Database', pct: 42, sharp: true },
      ],
      scoreDistribution: [15, 50, 140, 260, 230, 170, 80, 30, 5],
      scoreBenchmark: 55,
    },
    {
      id: 3, emoji: '📊', name: 'Data Scientist', status: 'Published',
      enrolled: 620, stepsCount: 8, skillsCount: 10, avgCompletion: 22,
      description: 'From statistics fundamentals through machine learning and deep learning. Covers Python, pandas, scikit-learn, TensorFlow, and data visualization for aspiring data scientists.',
      targetRoles: ['Junior Data Scientist', 'ML Engineer', 'Data Analyst'],
      salaryMin: 45000, salaryMax: 95000, difficulty: 4, estimatedWeeks: 18, hoursPerWeek: 12,
      showInOnboarding: true, showInExplorer: true, showInAI: true, createdAt: 'Dec 10, 2023',
      skills: [
        { name: 'Python', category: 'Backend', importance: 'Required', weight: 10 },
      ],
      roadmapSteps: [],
      interviewQuestions: [],
      marketDemand: [], skillGaps: [], activeJobs: [],
      totalEnrolled: 620, activeThisMonth: 142, avgCompletionRate: 22, dropoutStep: 3,
      dropoutStepName: 'Statistical Modeling',
      enrollmentWeekly: [8, 12, 10, 15, 18, 14, 11, 20, 16, 13, 10, 22, 15],
      stepCompletions: [], scoreDistribution: [10, 30, 90, 180, 160, 100, 40, 10, 0],
      scoreBenchmark: 50,
    },
    {
      id: 4, emoji: '☁️', name: 'Cloud Architect', status: 'Published',
      enrolled: 340, stepsCount: 7, skillsCount: 11, avgCompletion: 19,
      description: 'Design and deploy scalable cloud infrastructure. Covers AWS, Azure, networking, IaC with Terraform, and observability.',
      targetRoles: ['Cloud Engineer', 'Infrastructure Engineer', 'Solutions Architect'],
      salaryMin: 55000, salaryMax: 120000, difficulty: 5, estimatedWeeks: 20, hoursPerWeek: 10,
      showInOnboarding: true, showInExplorer: true, showInAI: true, createdAt: 'Jan 05, 2024',
      skills: [
        { name: 'AWS', category: 'DevOps', importance: 'Required', weight: 9 },
        { name: 'Docker', category: 'DevOps', importance: 'Required', weight: 8 },
        { name: 'Kubernetes', category: 'DevOps', importance: 'Required', weight: 8 },
        { name: 'Terraform', category: 'DevOps', importance: 'Required', weight: 7 },
      ],
      roadmapSteps: [],
      interviewQuestions: [],
      marketDemand: [], skillGaps: [], activeJobs: [],
      totalEnrolled: 340, activeThisMonth: 78, avgCompletionRate: 19, dropoutStep: 3,
      dropoutStepName: 'Kubernetes Orchestration',
      enrollmentWeekly: [5, 8, 6, 10, 12, 9, 7, 14, 11, 8, 6, 16, 10],
      stepCompletions: [], scoreDistribution: [5, 20, 60, 100, 80, 50, 20, 5, 0],
      scoreBenchmark: 45,
    },
    {
      id: 5, emoji: '📱', name: 'Mobile Developer', status: 'Published',
      enrolled: 450, stepsCount: 8, skillsCount: 9, avgCompletion: 26,
      description: 'Build native and cross-platform mobile apps with React Native and Flutter. Covers UI patterns, state management, offline-first, and app store deployment.',
      targetRoles: ['Mobile Developer', 'React Native Developer', 'Flutter Developer'],
      salaryMin: 38000, salaryMax: 80000, difficulty: 3, estimatedWeeks: 14, hoursPerWeek: 10,
      showInOnboarding: true, showInExplorer: true, showInAI: true, createdAt: 'Feb 14, 2024',
      skills: [], roadmapSteps: [], interviewQuestions: [],
      marketDemand: [], skillGaps: [], activeJobs: [],
      totalEnrolled: 450, activeThisMonth: 120, avgCompletionRate: 26, dropoutStep: 4,
      dropoutStepName: 'Native Modules',
      enrollmentWeekly: [10, 14, 8, 18, 20, 15, 12, 22, 18, 14, 11, 24, 16],
      stepCompletions: [], scoreDistribution: [8, 25, 75, 150, 120, 50, 18, 4, 0],
      scoreBenchmark: 52,
    },
    {
      id: 6, emoji: '🛡️', name: 'Cybersecurity Analyst', status: 'Published',
      enrolled: 280, stepsCount: 7, skillsCount: 10, avgCompletion: 18,
      description: 'Learn network security, penetration testing, incident response, and compliance. Covers OWASP, ethical hacking tools, and zero-trust architecture.',
      targetRoles: ['Security Analyst', 'Penetration Tester', 'Security Engineer'],
      salaryMin: 42000, salaryMax: 90000, difficulty: 4, estimatedWeeks: 16, hoursPerWeek: 10,
      showInOnboarding: true, showInExplorer: true, showInAI: true, createdAt: 'Mar 01, 2024',
      skills: [], roadmapSteps: [], interviewQuestions: [],
      marketDemand: [], skillGaps: [], activeJobs: [],
      totalEnrolled: 280, activeThisMonth: 65, avgCompletionRate: 18, dropoutStep: 3,
      dropoutStepName: 'Network Security Protocols',
      enrollmentWeekly: [4, 6, 5, 8, 10, 7, 6, 12, 9, 7, 5, 13, 8],
      stepCompletions: [], scoreDistribution: [4, 15, 45, 80, 70, 40, 20, 6, 0],
      scoreBenchmark: 48,
    },
    {
      id: 7, emoji: '🤖', name: 'AI / ML Engineer', status: 'Draft',
      enrolled: 0, stepsCount: 6, skillsCount: 8, avgCompletion: 0,
      description: 'Deep dive into machine learning, neural networks, NLP, and computer vision. Build production ML pipelines with MLOps practices.',
      targetRoles: ['ML Engineer', 'AI Developer', 'Deep Learning Engineer'],
      salaryMin: 55000, salaryMax: 130000, difficulty: 5, estimatedWeeks: 22, hoursPerWeek: 12,
      showInOnboarding: false, showInExplorer: false, showInAI: false, createdAt: 'Apr 10, 2024',
      skills: [], roadmapSteps: [], interviewQuestions: [],
      marketDemand: [], skillGaps: [], activeJobs: [],
      totalEnrolled: 0, activeThisMonth: 0, avgCompletionRate: 0, dropoutStep: 0,
      dropoutStepName: 'N/A',
      enrollmentWeekly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      stepCompletions: [], scoreDistribution: [],
      scoreBenchmark: 50,
    },
    {
      id: 8, emoji: '⚙️', name: 'DevOps Engineer', status: 'Draft',
      enrolled: 0, stepsCount: 5, skillsCount: 7, avgCompletion: 0,
      description: 'Master CI/CD pipelines, containerization, infrastructure as code, monitoring, and site reliability engineering.',
      targetRoles: ['DevOps Engineer', 'SRE', 'Platform Engineer'],
      salaryMin: 50000, salaryMax: 110000, difficulty: 4, estimatedWeeks: 16, hoursPerWeek: 10,
      showInOnboarding: false, showInExplorer: false, showInAI: false, createdAt: 'Apr 15, 2024',
      skills: [], roadmapSteps: [], interviewQuestions: [],
      marketDemand: [], skillGaps: [], activeJobs: [],
      totalEnrolled: 0, activeThisMonth: 0, avgCompletionRate: 0, dropoutStep: 0,
      dropoutStepName: 'N/A',
      enrollmentWeekly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      stepCompletions: [], scoreDistribution: [],
      scoreBenchmark: 50,
    },
  ];

  /* ══════════ COMPUTED ══════════ */

  get filteredPaths(): CareerPath[] {
    return this.paths.filter(p => {
      const matchSearch = !this.listSearch || p.name.toLowerCase().includes(this.listSearch.toLowerCase());
      const matchFilter = this.listFilter === 'All' || p.status === this.listFilter;
      return matchSearch && matchFilter;
    });
  }

  get selectedPath(): CareerPath | null {
    return this.paths.find(p => p.id === this.selectedPathId) || null;
  }

  get totalActivePaths(): number { return this.paths.filter(p => p.status === 'Published').length; }
  get mostPopular(): CareerPath | null {
    return this.paths.filter(p => p.status === 'Published').sort((a, b) => b.enrolled - a.enrolled)[0] || null;
  }
  get highestCompletion(): CareerPath | null {
    return this.paths.filter(p => p.status === 'Published').sort((a, b) => b.avgCompletion - a.avgCompletion)[0] || null;
  }
  get pendingReviewCount(): number { return this.paths.filter(p => p.status === 'Draft').length; }

  /* ── Skills tab helpers ── */
  get selectedSkillCategories(): string[] {
    if (!this.selectedPath) return [];
    const cats = new Set(this.selectedPath.skills.map(s => s.category));
    return [...cats];
  }
  filteredSkillsInCategory(category: string): PathSkill[] {
    if (!this.selectedPath) return [];
    return this.selectedPath.skills.filter(s => {
      const matchCat = s.category === category;
      const matchSearch = !this.skillSearch || s.name.toLowerCase().includes(this.skillSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }
  isCategoryCollapsed(cat: string): boolean { return this.collapsedCategories.has(cat); }
  toggleCategory(cat: string): void {
    this.collapsedCategories.has(cat) ? this.collapsedCategories.delete(cat) : this.collapsedCategories.add(cat);
  }
  get requiredSkillsCount(): number { return this.selectedPath?.skills.filter(s => s.importance === 'Required').length || 0; }
  get preferredSkillsCount(): number { return this.selectedPath?.skills.filter(s => s.importance === 'Preferred').length || 0; }
  get optionalSkillsCount(): number { return this.selectedPath?.skills.filter(s => s.importance === 'Optional').length || 0; }

  get catalogSearchResults(): CatalogSkill[] {
    if (!this.addSkillSearch.trim() || !this.selectedPath) return [];
    const existing = new Set(this.selectedPath.skills.map(s => s.name));
    return this.globalSkillCatalog.filter(s =>
      !existing.has(s.name) && s.name.toLowerCase().includes(this.addSkillSearch.toLowerCase())
    ).slice(0, 8);
  }

  addSkillFromCatalog(s: CatalogSkill): void {
    if (!this.selectedPath) return;
    this.selectedPath.skills.push({ name: s.name, category: s.category, importance: 'Preferred', weight: 5 });
    this.addSkillSearch = '';
  }
  removeSkill(skill: PathSkill): void {
    if (!this.selectedPath) return;
    this.selectedPath.skills = this.selectedPath.skills.filter(s => s !== skill);
  }
  createNewSkill(): void {
    if (!this.newSkillName.trim() || !this.selectedPath) return;
    this.globalSkillCatalog.push({ name: this.newSkillName, category: this.newSkillCategory });
    this.selectedPath.skills.push({ name: this.newSkillName, category: this.newSkillCategory, importance: 'Preferred', weight: 5 });
    this.newSkillName = '';
    this.newSkillDesc = '';
    this.showNewSkillForm = false;
  }

  /* ── IQ helpers ── */
  get filteredIQs(): InterviewQ[] {
    if (!this.selectedPath) return [];
    return this.selectedPath.interviewQuestions.filter(q => {
      const matchSearch = !this.iqSearch || q.text.toLowerCase().includes(this.iqSearch.toLowerCase());
      const matchDiff = this.iqDiffFilter === 'All' || q.difficulty === this.iqDiffFilter;
      return matchSearch && matchDiff;
    });
  }
  get iqTechnical(): number { return this.selectedPath?.interviewQuestions.filter(q => q.category === 'Technical').length || 0; }
  get iqBehavioral(): number { return this.selectedPath?.interviewQuestions.filter(q => q.category === 'Behavioral').length || 0; }
  get iqSystemDesign(): number { return this.selectedPath?.interviewQuestions.filter(q => q.category === 'System Design').length || 0; }

  get availableQuestionsForModal(): InterviewQ[] {
    if (!this.selectedPath) return [];
    const existing = new Set(this.selectedPath.interviewQuestions.map(q => q.id));
    return this.globalQuestionBank.filter(q => {
      const notLinked = !existing.has(q.id);
      const matchSearch = !this.addQSearch || q.text.toLowerCase().includes(this.addQSearch.toLowerCase());
      return notLinked && matchSearch;
    });
  }
  toggleAddQ(id: number): void {
    this.addQSelected.has(id) ? this.addQSelected.delete(id) : this.addQSelected.add(id);
  }
  addSelectedQuestions(): void {
    if (!this.selectedPath) return;
    this.globalQuestionBank.filter(q => this.addQSelected.has(q.id)).forEach(q => {
      this.selectedPath!.interviewQuestions.push({ ...q });
    });
    this.addQSelected.clear();
    this.showAddQuestionsModal = false;
  }
  removeIQ(q: InterviewQ): void {
    if (!this.selectedPath) return;
    this.selectedPath.interviewQuestions = this.selectedPath.interviewQuestions.filter(x => x.id !== q.id);
  }

  /* ── Roadmap helpers ── */
  toggleStepEdit(step: RoadmapStep): void {
    this.editingStepId = this.editingStepId === step.id ? null : step.id;
    step.expanded = !step.expanded;
  }
  addNewStep(): void {
    if (!this.selectedPath) return;
    const newId = this.selectedPath.roadmapSteps.length > 0
      ? Math.max(...this.selectedPath.roadmapSteps.map(s => s.id)) + 1 : 1;
    this.selectedPath.roadmapSteps.push({
      id: newId, title: 'New Step', description: '', estimatedHours: 5,
      difficulty: 'Beginner', resources: [], expanded: true
    });
    this.editingStepId = newId;
  }
  removeStep(step: RoadmapStep): void {
    if (!this.selectedPath) return;
    this.selectedPath.roadmapSteps = this.selectedPath.roadmapSteps.filter(s => s.id !== step.id);
    if (this.editingStepId === step.id) this.editingStepId = null;
  }
  addResource(step: RoadmapStep): void {
    step.resources.push({ url: '', title: '', type: 'Article', free: true });
  }
  removeResource(step: RoadmapStep, idx: number): void {
    step.resources.splice(idx, 1);
  }
  getTotalHours(): number {
    return this.selectedPath?.roadmapSteps.reduce((s, st) => s + st.estimatedHours, 0) || 0;
  }

  /* ── Path actions ── */
  selectPath(id: number): void {
    this.selectedPathId = id;
    this.editMode = false;
    this.activeTab = 'overview';
  }
  enterEdit(): void { this.editMode = true; }
  discardEdit(): void { this.editMode = false; }
  saveChanges(): void { this.editMode = false; }

  createNewPath(): void {
    const newId = Math.max(...this.paths.map(p => p.id)) + 1;
    const np: CareerPath = {
      id: newId, emoji: '🚀', name: 'New Career Path', status: 'Draft',
      enrolled: 0, stepsCount: 0, skillsCount: 0, avgCompletion: 0,
      description: '', targetRoles: [], salaryMin: 0, salaryMax: 0,
      difficulty: 1, estimatedWeeks: 8, hoursPerWeek: 10,
      showInOnboarding: false, showInExplorer: false, showInAI: false,
      createdAt: 'Apr 20, 2024',
      skills: [], roadmapSteps: [], interviewQuestions: [],
      marketDemand: [], skillGaps: [], activeJobs: [],
      totalEnrolled: 0, activeThisMonth: 0, avgCompletionRate: 0, dropoutStep: 0,
      dropoutStepName: 'N/A', enrollmentWeekly: [], stepCompletions: [],
      scoreDistribution: [], scoreBenchmark: 50,
    };
    this.paths.push(np);
    this.selectedPathId = newId;
    this.editMode = true;
    this.activeTab = 'overview';
  }

  addRole(): void {
    if (!this.newRoleInput.trim() || !this.selectedPath) return;
    this.selectedPath.targetRoles.push(this.newRoleInput.trim());
    this.newRoleInput = '';
  }
  removeRole(idx: number): void {
    this.selectedPath?.targetRoles.splice(idx, 1);
  }

  getDifficultyLabel(d: number): string {
    return ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'][d] || '';
  }
  getDifficultyClass(d: string): string {
    switch (d) {
      case 'Beginner': return 'dbadge--green';
      case 'Intermediate': return 'dbadge--teal';
      case 'Advanced': return 'dbadge--orange';
      case 'Expert': return 'dbadge--red';
      default: return '';
    }
  }
  getCategoryClass(c: string): string {
    switch (c) {
      case 'Technical': return 'cbadge--blue';
      case 'Behavioral': return 'cbadge--purple';
      case 'System Design': return 'cbadge--amber';
      default: return '';
    }
  }

  selectEmoji(e: string): void {
    if (this.selectedPath) this.selectedPath.emoji = e;
    this.showEmojiPicker = false;
  }

  togglePublishConfirm(): void { this.showPublishConfirm = !this.showPublishConfirm; }
  confirmPublish(): void {
    if (this.selectedPath) this.selectedPath.status = 'Published';
    this.showPublishConfirm = false;
  }

  get maxEnrollmentWeekly(): number {
    return Math.max(...(this.selectedPath?.enrollmentWeekly || [1]));
  }
  get maxScoreDist(): number {
    return Math.max(...(this.selectedPath?.scoreDistribution || [1]));
  }
}
