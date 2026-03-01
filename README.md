# SmartHire — AI-Powered Career Platform (Frontend)

An Angular 18 single-page application for **SmartHire**, an AI-driven career development and recruitment platform that connects job seekers with opportunities through intelligent skill assessment, personalized roadmaps, and AI-facilitated mock interviews.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Angular 18.2** (standalone components, signals, `@if`/`@for` control flow) |
| Language | TypeScript 5.5 |
| Styling | **SCSS** + **Tailwind CSS 3.4** (utility-first) |
| Icons | **Lucide Angular 0.575** (`lucide-angular`) |
| Animations | **GSAP 3.14** (scroll-triggered), Angular Animations |
| Smooth Scroll | **Lenis** (`@studio-freight/lenis`) |
| Particles | **tsparticles** (landing page backgrounds) |
| UI Components | Angular Material / CDK 18.2 (select utilities) |
| Build | Angular CLI 18.2, esbuild |

---

## Prerequisites

| Requirement | Minimum Version |
|-------------|----------------|
| **Node.js** | 18.x or 20.x+ |
| **npm** | 9.x+ |
| **Angular CLI** | 18.x (`npm i -g @angular/cli@18`) |

---

## Getting Started

```bash
# 1. Clone the repository
git clone <repository-url>
cd smarthire-frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
ng serve
# → opens at http://localhost:4200

# 4. Build for production
ng build
# → output in dist/smarthire-frontend/
```

---

## Project Structure

```
src/
├── app/
│   ├── app.component.*          # Root shell
│   ├── app.config.ts            # Application bootstrap config (providers)
│   ├── app.routes.ts            # All route definitions (lazy-loaded)
│   │
│   ├── shared/                  # Reusable across front + back office
│   │   ├── lucide-icons.ts      # Centralised Lucide icon registration (NgModule wrapper)
│   │   ├── navbar/              # Public landing navbar (logo + links)
│   │   └── footer/              # Site-wide footer with social links
│   │
│   └── features/
│       ├── front-office/        # Candidate / Recruiter facing
│       │   ├── landing/         # Marketing landing page
│       │   ├── auth/            # Login & Register
│       │   ├── onboarding/      # 4-step onboarding wizard
│       │   └── dashboard/       # Authenticated dashboard (7 child pages)
│       │
│       └── back-office/         # Admin panel
│           └── admin/
│               ├── layout/      # Shell (sidebar + topbar + router-outlet)
│               ├── components/  # Admin sidebar & topbar
│               ├── dashboard/   # Admin home
│               ├── users/       # User management
│               ├── recruiters/  # Recruiter verification
│               ├── jobs/        # Job offer moderation
│               ├── questions/   # Interview question bank
│               ├── ai-monitor/  # AI model health monitoring
│               ├── analytics/   # Platform analytics
│               ├── career-paths/# Career path CRUD
│               ├── system-health/# Infrastructure status
│               └── settings/    # Platform settings (10 categories)
│
├── styles.scss                  # Global styles + CSS variables
├── index.html                   # SPA entry point
└── main.ts                      # Bootstrap
```

---

## Routes & Pages

### Front Office (Public + Authenticated)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LandingPageComponent` | Marketing landing page with 10 animated sections: **Hero** (particle background + CTA), **Trust Bar** (company logos), **Problem** (pain points), **Solution** (animated radar chart), **Features Grid** (6 feature cards), **Stats** (counter animations), **How It Works** (3 steps with connectors), **Testimonials** (carousel), **Pricing** (3-tier cards), **CTA** (final conversion) |
| `/login` | `LoginComponent` | Email/password login with social OAuth buttons (Google, GitHub, LinkedIn, Microsoft), "Remember me" checkbox, password visibility toggle |
| `/register` | `RegisterComponent` | 2-step registration: role selection (Candidate/Recruiter) → form with name, email, password, real-time password strength meter, social OAuth, T&C checkbox |
| `/onboarding` | `OnboardingComponent` | 4-step wizard with progress stepper: **Career Goal** (target role + preferences), **Current Situation** (experience level + education), **Skill Check** (self-rated skill grid), **Results** (AI-generated radar chart + readiness score) |
| `/dashboard` | `DashboardLayoutComponent` | Authenticated shell with collapsible sidebar (8 nav items + settings/logout) and top bar (search, notifications, avatar dropdown) |
| `/dashboard` (index) | `DashboardHomeComponent` | Home dashboard: 4 stat cards (Interview Sessions, Roadmap Progress, Skills Acquired, Applications Sent), readiness score ring, AI recommendations list, skill gap analysis bars, streak tracker, upcoming steps timeline, recent activity feed |
| `/dashboard/roadmap` | `RoadmapComponent` | Career roadmap timeline: expandable step cards with resources (video/article/course), progress ring, estimated time per step, completion tracking |
| `/dashboard/assessment` | `AssessmentComponent` | Skill assessment: radar chart visualization of competencies, assessment history, category breakdowns |
| `/dashboard/cv` | `CvOptimizerComponent` | CV management: upload/edit multiple CVs, AI enhancement suggestions per section, CV score ring, set default CV, enhancement acceptance flow |
| `/dashboard/jobs` | `JobsComponent` | Job board: search + filters (role, location, contract, salary), job cards with AI match score rings, save/bookmark, verified employer badge, detail drawer with AI skill-gap breakdown |
| `/dashboard/profile` | `ProfileComponent` | User profile: avatar, location, social links (GitHub/LinkedIn/portfolio), readiness ring, skills list, GitHub repo grid, assessment radar chart |
| `/dashboard/settings` | `SettingsComponent` | User settings: avatar edit overlay, connected accounts (social OAuth), subscription tier with feature checklist |
| `/dashboard/interview` | `InterviewComponent` | Interview prep hub: Practice mode and Timed Test mode selection, configuration modal (role, difficulty, question count) |
| `/dashboard/interview/session/:id` | `InterviewSessionComponent` | Live interview: question display with category/difficulty chips, answer text area, AI hint callout, real-time feedback panel, animated completion checkmark |
| `/dashboard/interview/report/:id` | `InterviewReportComponent` | Post-interview report: overall score, radar chart breakdown by category, per-question expandable review with score + feedback |

### Back Office (Admin Panel)

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | `AdminLayoutComponent` | Admin shell with fixed sidebar (10 nav items) and topbar (search, notifications, admin avatar) |
| `/admin` (index) | `AdminDashboardComponent` | Overview: 4 stat cards, sparkline charts for key metrics, quick actions (export, send report, refresh, generate report), system status pills |
| `/admin/users` | `UserManagementComponent` | User CRUD: search + export CSV, paginated table with status badges, action menu (view/edit/suspend), modal detail view |
| `/admin/recruiters` | `RecruiterManagementComponent` | Recruiter verification: pending alert banner, search + export, status badges (Verified/Pending/Rejected), approval/reject workflow with modal |
| `/admin/jobs` | `JobManagementComponent` | Job moderation: flagged jobs alert, search + export, status tracking, detail drawer, action menu per job |
| `/admin/questions` | `QuestionManagementComponent` | Question bank: active/archived tab counts, search + filter, edit/preview/archive actions, pagination, create/edit panel with career path + tag multi-select dropdowns, AI generation option, preview modal |
| `/admin/ai-monitor` | `AiMonitorComponent` | AI health dashboard: 4 metric cards (Avg Rating with stars, Accuracy %, Response Latency, Daily Calls) with trend indicators, line chart over time, module usage bars, prompt performance table, lowest-rated recommendations list |
| `/admin/analytics` | `AnalyticsComponent` | Platform analytics: MRR + churn stat cards, plan distribution donut chart, funnel conversion with drop-off indicators, date range selector |
| `/admin/careers` | `CareerPathsComponent` | Career path editor: searchable path list, create new path, edit details with skill management (category groups, add/remove), roadmap step editor (resources, drag ordering), interview question linking with coverage indicators |
| `/admin/health` | `SystemHealthComponent` | Infrastructure monitoring: auto-refresh, overall status banner (Operational/Degraded), 4 service groups (Core API, AI Services, External Integrations, Infrastructure) each with individual service status + response times, API response time chart, infrastructure donut gauges, recent log table, rollback + cache clear modals |
| `/admin/settings` | `SettingsComponent` | Platform configuration: 10 category sidebar (General, Branding, AI Config, Email, Security, Billing, Feature Flags, API Keys, Legal, Danger Zone), General panel with Platform Identity form + Maintenance Mode toggle + Localization, placeholder panels for other categories, modal confirmations, toast notifications |

---

## Icon System

All icons use [Lucide Icons](https://lucide.dev) via `lucide-angular`.

**Architecture:**
- Icons are registered in a centralised wrapper NgModule at `src/app/shared/lucide-icons.ts`
- Components import `LUCIDE_ICONS` (the NgModule class) in their `@Component.imports` array
- Templates use `<lucide-icon name="icon-name" [size]="N" [strokeWidth]="N"></lucide-icon>`

**Adding a new icon:**
1. Find the PascalCase export name at [lucide.dev/icons](https://lucide.dev/icons)
2. Add it to both the `import { ... } from 'lucide-angular'` statement and the `icons` object in `src/app/shared/lucide-icons.ts`
3. Use it in any template: `<lucide-icon name="kebab-case-name" [size]="16"></lucide-icon>`

**Preserved as inline SVGs:**
- Brand logos (Google, GitHub, LinkedIn, Microsoft)
- Data visualizations (radar charts, donut charts, score rings, sparklines, progress rings)
- Custom decorative graphics (AI brain, animated checkmarks, empty states)

---

## Styling

- **CSS Variables** defined in `styles.scss`: `--bg-primary`, `--bg-secondary`, `--bg-card`, `--accent-teal`, `--accent-blue`, `--text-primary`, `--text-secondary`, `--border-subtle`
- **Tailwind CSS** for utility classes (spacing, flex, grid, responsive)
- **SCSS** for component-scoped styles (3-file component pattern: `.ts` + `.html` + `.scss`)
- **Dark theme** by default (dark backgrounds with light text, teal/blue accent gradients)

---

## Key Patterns

| Pattern | Details |
|---------|---------|
| **Standalone Components** | All components use `standalone: true` — no shared NgModules |
| **Lazy Loading** | Every route uses `loadComponent()` for code splitting |
| **Signals** | Angular signals used for reactive state (`signal()`, `computed()`) |
| **Control Flow** | `@if`, `@for`, `@switch` block syntax (Angular 17+ control flow) |
| **3-File Components** | Each component has `.ts`, `.html`, `.scss` files |
| **Feature Folders** | Code organised by domain feature, not by type |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` / `ng serve` | Start dev server at `http://localhost:4200` |
| `npm run build` / `ng build` | Production build to `dist/` |
| `npm run watch` | Development build in watch mode |
| `npm test` / `ng test` | Run unit tests via Karma |

---

## Environment

This is a **frontend-only** project. All data is currently mocked/hardcoded in component classes. To connect to a backend API:

1. Create environment files (`src/environments/environment.ts` + `environment.prod.ts`)
2. Add `apiUrl` configuration
3. Create Angular services with `HttpClient` to replace mocked data
4. Add `provideHttpClient()` to `app.config.ts`

---

## Browser Support

Angular 18 targets modern evergreen browsers:
- Chrome / Edge (latest)
- Firefox (latest)
- Safari (latest)
