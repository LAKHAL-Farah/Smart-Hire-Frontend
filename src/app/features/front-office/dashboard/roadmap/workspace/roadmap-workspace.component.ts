import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, Subscription, switchMap } from 'rxjs';
import {
  NodeCourseLessonDto,
  NodeCourseContentDto,
  NodeProjectLabDto,
  NodeProjectValidationResponseDto,
  NodeTutorPromptResponseDto,
  ProjectSubmissionDto,
  ProjectSuggestionDto,
  RoadmapApiService,
} from '../../../../../services/roadmap-api.service';
import { resolveRoadmapUserId } from '../roadmap-user-context';

type WorkspaceMode = 'course' | 'lab' | 'challenge' | 'chat';
type ChallengeFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';
type ChallengeStatusFilter = 'all' | 'not-started' | 'in-progress' | 'completed';
type ChallengeCardStatus = 'not-started' | 'in-progress' | 'completed';
type ChallengeDetailStatus = 'in-progress' | 'submitted' | 'needs-review';

interface WorkspaceContext {
  mode: WorkspaceMode;
  roadmapId: number;
  userId: number;
  nodeId: number;
  stepOrder: number;
  stepTitle: string;
  stepStatus: string | null;
  locked: boolean;
  refresh: boolean;
  generate: boolean;
  historyId: number | null;
  generatedAt: string | null;
  challengeId: number | null;
  chatSessionId: number | null;
}

interface CourseTocEntry {
  key: string;
  type: 'section' | 'page' | 'lab';
  title: string;
  icon: string;
  pageCount?: number;
  lessonIndex?: number;
}

interface LabUserStoryCard {
  title: string;
  description: string;
}

interface LabGuideStep {
  index: number;
  title: string;
  instruction: string;
  inlineCode: string;
  expectedOutput: string;
}

interface LabConsoleLine {
  id: number;
  tone: 'log' | 'success' | 'error';
  text: string;
}

interface CourseTextBlock {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'bulleted' | 'numbered';
  text?: string;
  items?: string[];
}

interface ChallengeWorkspaceCard {
  id: number;
  createdAt?: string;
  title: string;
  description: string;
  estimatedDays: number;
  difficulty: string;
  techStack: string[];
  repoUrlDraft: string;
  submission: ProjectSubmissionDto | null;
  submitting: boolean;
  reviewLoading: boolean;
  reviewText: string | null;
}

interface ChallengeScoreHistoryEntry {
  source: 'submission' | 'review';
  capturedAt: string;
  previous: number | null;
  current: number;
  delta: number | null;
  retryCount: number | null;
}

interface ChallengeScoreItem {
  label: string;
  value: number | null | undefined;
}

interface ChatWorkspaceMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  aiGenerated: boolean;
}

interface ChatWorkspaceSession {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatWorkspaceMessage[];
}

@Component({
  selector: 'app-roadmap-workspace',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './roadmap-workspace.component.html',
  styleUrl: './roadmap-workspace.component.scss',
})
export class RoadmapWorkspaceComponent implements OnInit, OnDestroy {
  private readonly roadmapApi = inject(RoadmapApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  private queryParamSub: Subscription | null = null;
  private infoTimer: ReturnType<typeof setTimeout> | null = null;
  private copiedCodeTimer: ReturnType<typeof setTimeout> | null = null;

  readonly maxSubmissionRetries = 3;

  readonly context = signal<WorkspaceContext | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);

  readonly courseLoading = signal(false);
  readonly courseLabLoading = signal(false);
  readonly course = signal<NodeCourseContentDto | null>(null);
  readonly courseHistory = signal<NodeCourseContentDto[]>([]);
  readonly activeLessonIndex = signal(0);
  readonly activeCourseSectionKey = signal('page-0');
  readonly lessonCompletionState = signal<Record<number, boolean>>({});
  readonly labChecklistState = signal<Record<number, boolean>>({});
  readonly labGuideCompletionState = signal<Record<number, boolean>>({});
  readonly labConsoleLines = signal<LabConsoleLine[]>([]);
  readonly copiedCodeBlockKey = signal<string | null>(null);

  readonly labLoading = signal(false);
  readonly projectLab = signal<NodeProjectLabDto | null>(null);
  readonly projectLabHistory = signal<NodeProjectLabDto[]>([]);
  readonly projectSolutionDraft = signal('');
  readonly projectValidation = signal<NodeProjectValidationResponseDto | null>(null);
  readonly projectValidationLoading = signal(false);

  readonly challengesLoading = signal(false);
  readonly challenges = signal<ChallengeWorkspaceCard[]>([]);
  readonly activeChallengeId = signal<number | null>(null);
  readonly challengeFilter = signal<ChallengeFilter>('all');
  readonly challengeStatusFilter = signal<ChallengeStatusFilter>('all');
  readonly challengeSearchQuery = signal('');
  readonly challengeScoreSnapshots = signal<Record<number, ChallengeScoreHistoryEntry[]>>({});

  readonly chatSessions = signal<ChatWorkspaceSession[]>([]);
  readonly activeChatSessionId = signal<number | null>(null);
  readonly chatDraft = signal('');
  readonly chatSending = signal(false);

  readonly mode = computed<WorkspaceMode>(() => this.context()?.mode ?? 'course');

  readonly isCourseLocked = computed(() => {
    const context = this.context();
    return this.mode() === 'course' && !!context?.locked;
  });

  readonly lessonCount = computed(() => this.course()?.lessons?.length ?? 0);

  readonly courseTocEntries = computed<CourseTocEntry[]>(() => {
    const lessons = this.course()?.lessons || [];
    const entries: CourseTocEntry[] = [
      {
        key: 'section-pages',
        type: 'section',
        title: 'Course Pages',
        icon: 'S',
        pageCount: lessons.length,
      },
    ];

    for (let index = 0; index < lessons.length; index += 1) {
      const lesson = lessons[index];
      entries.push({
        key: `page-${index}`,
        type: 'page',
        title: lesson.sectionTitle || `Page ${index + 1}`,
        icon: 'P',
        lessonIndex: index,
      });
    }

    entries.push({
      key: 'lab',
      type: 'lab',
      title: 'Lab',
      icon: 'L',
    });

    return entries;
  });

  readonly courseNavigableKeys = computed(() => {
    const keys = (this.course()?.lessons || []).map((_lesson, index) => `page-${index}`);
    keys.push('lab');
    return keys;
  });

  readonly activeCoursePageIndex = computed(() => {
    const keys = this.courseNavigableKeys();
    if (keys.length === 0) {
      return 0;
    }

    const sectionKey = this.activeCourseSectionKey();
    const directMatch = keys.findIndex((key) => key === sectionKey);
    if (directMatch >= 0) {
      return directMatch;
    }

    return Math.min(Math.max(this.activeLessonIndex(), 0), Math.max(keys.length - 1, 0));
  });

  readonly coursePageTotal = computed(() => this.courseNavigableKeys().length);

  readonly coursePageProgressLabel = computed(() => {
    const total = this.coursePageTotal();
    if (total === 0) {
      return 'Page 0 of 0';
    }

    return `Page ${this.activeCoursePageIndex() + 1} of ${total}`;
  });

  readonly activeCourseBreadcrumb = computed(() => {
    const sectionKey = this.activeCourseSectionKey();
    const courseName = this.course()?.courseTitle || this.context()?.stepTitle || 'Course';

    if (sectionKey === 'lab') {
      return {
        courseName,
        sectionName: 'Lab',
        pageName: 'Build Your Lab',
      };
    }

    const lesson = this.activeLesson();
    return {
      courseName,
      sectionName: `Section ${this.activeLessonIndex() + 1}`,
      pageName: lesson?.sectionTitle || 'Course Page',
    };
  });

  readonly activeCourseHeading = computed(() => {
    if (this.activeCourseSectionKey() === 'lab') {
      const projectTitle = this.projectLab()?.projectTitle?.trim();
      return projectTitle || 'Lab Project Sprint';
    }

    const lesson = this.activeLesson();
    if (lesson?.sectionTitle?.trim()) {
      return lesson.sectionTitle.trim();
    }

    return this.course()?.courseTitle || 'Course Page';
  });

  readonly lessonBlocksByIndex = computed<Record<number, CourseTextBlock[]>>(() => {
    const blocks: Record<number, CourseTextBlock[]> = {};
    const lessons = this.course()?.lessons || [];

    for (let index = 0; index < lessons.length; index += 1) {
      blocks[index] = this.parseLessonExplanationBlocks(lessons[index]);
    }

    return blocks;
  });

  readonly labStoryCards = computed<LabUserStoryCard[]>(() => {
    const stories = this.projectLab()?.userStories || [];
    return stories.map((story, index) => this.toLabUserStory(story, index));
  });

  readonly labGuideSteps = computed<LabGuideStep[]>(() => {
    const projectLab = this.projectLab();
    if (!projectLab) {
      return [];
    }

    const source =
      projectLab.acceptanceCriteria.length > 0
        ? projectLab.acceptanceCriteria
        : projectLab.userStories;

    return source.map((rawStep, index) => {
      const instruction = (rawStep || '').trim() || `Complete lab checkpoint ${index + 1}.`;
      const title = `Step ${index + 1}`;

      return {
        index,
        title,
        instruction,
        inlineCode: this.extractInlineCode(instruction),
        expectedOutput: this.deriveExpectedOutput(instruction),
      };
    });
  });

  readonly labGuideCompletedCount = computed(() => {
    const steps = this.labGuideSteps();
    if (steps.length === 0) {
      return 0;
    }

    const completion = this.labGuideCompletionState();
    let completed = 0;
    for (let index = 0; index < steps.length; index += 1) {
      if (completion[index]) {
        completed += 1;
      }
    }

    return completed;
  });

  readonly activeLabGuideStepNumber = computed(() => {
    const steps = this.labGuideSteps();
    if (steps.length === 0) {
      return 0;
    }

    const completion = this.labGuideCompletionState();
    const firstOpen = steps.findIndex((step) => !completion[step.index]);
    return firstOpen >= 0 ? firstOpen + 1 : steps.length;
  });

  readonly completedLessonCount = computed(() => {
    const lessonCount = this.lessonCount();
    if (lessonCount === 0) {
      return 0;
    }

    let completed = 0;
    const completion = this.lessonCompletionState();
    for (let index = 0; index < lessonCount; index += 1) {
      if (completion[index]) {
        completed += 1;
      }
    }
    return completed;
  });

  readonly courseProgressPercent = computed(() => {
    const lessonCount = this.lessonCount();
    if (lessonCount === 0) {
      return 0;
    }
    return Math.round((this.completedLessonCount() / lessonCount) * 100);
  });

  readonly activeLesson = computed(() => {
    const course = this.course();
    if (!course?.lessons?.length) {
      return null;
    }

    const index = Math.max(0, Math.min(this.activeLessonIndex(), course.lessons.length - 1));
    return course.lessons[index] ?? null;
  });

  readonly activeLessonReadMinutes = computed(() => {
    const lesson = this.activeLesson();
    if (!lesson) {
      return 0;
    }

    const content = [
      lesson.explanation,
      lesson.miniExample,
      lesson.codeSnippet,
      ...(lesson.commonPitfalls || []),
      ...(lesson.practiceTasks || []),
    ]
      .filter((value) => !!value)
      .join(' ')
      .trim();

    if (!content) {
      return 0;
    }

    const wordCount = content.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(wordCount / 170));
  });

  readonly courseCheckpointCount = computed(() => this.course()?.checkpoints?.length ?? 0);

  readonly courseCheatSheetCount = computed(() => this.course()?.cheatSheet?.length ?? 0);

  readonly activeLessonDone = computed(
    () => this.lessonCompletionState()[this.activeLessonIndex()] === true
  );

  readonly canOpenPreviousLesson = computed(() => this.activeCoursePageIndex() > 0);

  readonly canOpenNextLesson = computed(
    () => this.activeCoursePageIndex() < this.coursePageTotal() - 1
  );

  readonly activeChallenge = computed(() => {
    const activeId = this.activeChallengeId();
    if (!activeId) {
      return null;
    }

    return this.challenges().find((challenge) => challenge.id === activeId) ?? null;
  });

  readonly filteredChallenges = computed(() => {
    return this.applyChallengeFilters(this.challenges());
  });

  readonly activeChallengeRepoUrl = computed(() => {
    const challenge = this.activeChallenge();
    if (!challenge) {
      return '';
    }

    return (challenge.repoUrlDraft || challenge.submission?.repoUrl || '').trim();
  });

  readonly activeChallengeRepoUrlValid = computed(() =>
    this.isValidGithubRepositoryUrl(this.activeChallengeRepoUrl())
  );

  readonly activeChatSession = computed(() => {
    const activeId = this.activeChatSessionId();
    if (!activeId) {
      return null;
    }

    return this.chatSessions().find((session) => session.id === activeId) ?? null;
  });

  readonly projectLabStoryCount = computed(() => this.projectLab()?.userStories?.length ?? 0);

  readonly projectLabAcceptanceCount = computed(
    () => this.projectLab()?.acceptanceCriteria?.length ?? 0
  );

  readonly projectLabStretchCount = computed(() => this.projectLab()?.stretchGoals?.length ?? 0);

  readonly projectDraftCharCount = computed(() => this.projectSolutionDraft().length);

  readonly projectDraftLineCount = computed(() => {
    const draft = this.projectSolutionDraft();
    if (!draft.trim()) {
      return 0;
    }

    return draft.split(/\r?\n/).length;
  });

  readonly validationScorePercent = computed(() => this.projectValidation()?.scorePercent ?? 0);

  readonly validationSummaryTone = computed(() => {
    const validation = this.projectValidation();
    if (!validation) {
      return 'Run validation to get readiness feedback for this project lab.';
    }

    if (validation.passed) {
      return 'Validation signal is strong. Tighten edge cases before final submission.';
    }

    return 'Validation found gaps. Use the improvement list below for your next pass.';
  });

  readonly activeChallengeSubmission = computed(() => this.activeChallenge()?.submission ?? null);

  readonly activeChallengeReviewText = computed(() => {
    const challenge = this.activeChallenge();
    const explicitReview = (challenge?.reviewText || '').trim();
    if (explicitReview) {
      return explicitReview;
    }

    const feedback = (challenge?.submission?.aiFeedback || '').trim();
    return feedback || null;
  });

  readonly activeChallengeHasReview = computed(() => !!this.activeChallengeReviewText());

  readonly activeChallengeRecommendations = computed(
    () => this.activeChallengeSubmission()?.recommendations || []
  );

  readonly activeChallengeRetryLeft = computed(() => {
    const submission = this.activeChallengeSubmission();
    if (!submission) {
      return this.maxSubmissionRetries;
    }

    return Math.max(0, this.maxSubmissionRetries - (submission.retryCount || 0));
  });

  readonly activeChallengeWorkflowPercent = computed(() => {
    const hasRepoUrl = this.activeChallengeRepoUrl().length > 0;
    const hasSubmission = !!this.activeChallengeSubmission();
    const hasReview = this.activeChallengeHasReview();
    const hasRetryHeadroom = hasSubmission && this.activeChallengeRetryLeft() > 0;

    let completeSteps = 0;
    if (hasRepoUrl) {
      completeSteps += 1;
    }
    if (hasSubmission) {
      completeSteps += 1;
    }
    if (hasReview) {
      completeSteps += 1;
    }
    if (hasRetryHeadroom) {
      completeSteps += 1;
    }

    return Math.round((completeSteps / 4) * 100);
  });

  readonly activeChallengeScoreHistory = computed(() => {
    const challenge = this.activeChallenge();
    if (!challenge) {
      return [] as ChallengeScoreHistoryEntry[];
    }

    const history = this.challengeScoreSnapshots()[challenge.id] || [];
    if (history.length > 0) {
      return history;
    }

    const fallbackScore = this.toSafeScore(challenge.submission?.score);
    if (!challenge.submission || fallbackScore === null) {
      return [] as ChallengeScoreHistoryEntry[];
    }

    return [
      {
        source: 'submission',
        capturedAt:
          challenge.submission.reviewedAt ||
          challenge.submission.submittedAt ||
          new Date().toISOString(),
        previous: fallbackScore,
        current: fallbackScore,
        delta: 0,
        retryCount: challenge.submission.retryCount ?? null,
      },
    ];
  });

  readonly activeChallengeScoreTransition = computed(() => {
    const history = this.activeChallengeScoreHistory();
    if (history.length === 0) {
      return null;
    }

    for (let index = history.length - 1; index >= 0; index -= 1) {
      const entry = history[index];
      if (entry.delta !== null && entry.previous !== entry.current) {
        return entry;
      }
    }

    return history[history.length - 1] ?? null;
  });

  readonly activeChallengeScoreDelta = computed(
    () => this.activeChallengeScoreTransition()?.delta ?? null
  );

  readonly activeChallengeScoreItems = computed(() => {
    const submission = this.activeChallengeSubmission();
    if (!submission) {
      return [] as ChallengeScoreItem[];
    }

    const items: ChallengeScoreItem[] = [
      { label: 'Overall', value: this.toSafeScore(submission.score) },
      { label: 'README', value: this.toSafeScore(submission.readmeScore) },
      { label: 'Structure', value: this.toSafeScore(submission.structureScore) },
      { label: 'Tests', value: this.toSafeScore(submission.testScore) },
      { label: 'CI', value: this.toSafeScore(submission.ciScore) },
    ];

    return items.filter((item) => item.value !== null);
  });

  ngOnInit(): void {
    this.queryParamSub = this.route.queryParamMap.subscribe(() => {
      this.initializeFromRoute();
    });
  }

  ngOnDestroy(): void {
    this.queryParamSub?.unsubscribe();
    this.queryParamSub = null;

    if (this.infoTimer) {
      clearTimeout(this.infoTimer);
      this.infoTimer = null;
    }

    if (this.copiedCodeTimer) {
      clearTimeout(this.copiedCodeTimer);
      this.copiedCodeTimer = null;
    }
  }

  @HostListener('window:keydown', ['$event'])
  onWorkspaceKeydown(event: KeyboardEvent): void {
    if (this.mode() !== 'course' || this.isCourseLocked() || this.coursePageTotal() === 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const targetTag = (target?.tagName || '').toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea' || target?.isContentEditable) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.openPreviousLesson();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.openNextLesson();
    }
  }

  private initializeFromRoute(): void {
    const parsed = this.parseWorkspaceContext();
    if (!parsed) {
      this.context.set(null);
      this.errorMessage.set('Missing roadmap workspace context. Open this page from the roadmap panel.');
      return;
    }

    let context = parsed;
    if (context.mode === 'challenge' && !context.challengeId) {
      const persistedChallengeId = this.readPersistedChallengeId(context);
      if (persistedChallengeId) {
        context = {
          ...context,
          challengeId: persistedChallengeId,
        };
      }
    }

    this.context.set(context);
    this.errorMessage.set(null);
    this.setInfoMessage(null);

    if (context.mode === 'course') {
      const persistedLesson = this.readPersistedLessonIndex(context);
      this.activeLessonIndex.set(persistedLesson);
      this.activeCourseSectionKey.set(`page-${persistedLesson}`);
      this.lessonCompletionState.set(this.readPersistedLessonCompletion(context));
      this.labChecklistState.set(this.readPersistedLabChecklistState(context));
      this.labGuideCompletionState.set(this.readPersistedLabGuideCompletionState(context));

      if (this.labConsoleLines().length === 0) {
        this.appendLabConsole(
          'Workspace console initialized. Lab actions and validation output will stream here.',
          'log'
        );
      }
    }

    this.loadModeData(context);
  }

  modeLabel(mode: WorkspaceMode): string {
    if (mode === 'course') {
      return 'Course Studio';
    }
    if (mode === 'lab') {
      return 'Project Lab Studio';
    }
    if (mode === 'chat') {
      return 'Tutor Chat Studio';
    }
    return 'Challenge Studio';
  }

  setChallengeFilter(filter: ChallengeFilter): void {
    this.challengeFilter.set(filter);
    this.reconcileActiveChallengeSelection();
  }

  isChallengeFilterActive(filter: ChallengeFilter): boolean {
    return this.challengeFilter() === filter;
  }

  setChallengeStatusFilter(filter: ChallengeStatusFilter): void {
    this.challengeStatusFilter.set(filter);
    this.reconcileActiveChallengeSelection();
  }

  isChallengeStatusFilterActive(filter: ChallengeStatusFilter): boolean {
    return this.challengeStatusFilter() === filter;
  }

  setChallengeSearchQuery(value: string): void {
    this.challengeSearchQuery.set((value || '').trimStart());
    this.reconcileActiveChallengeSelection();
  }

  challengeDifficultyLabel(challenge: ChallengeWorkspaceCard): string {
    const key = this.toChallengeDifficultyKey(challenge.difficulty);
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  challengeDifficultyToneClass(challenge: ChallengeWorkspaceCard): string {
    const key = this.toChallengeDifficultyKey(challenge.difficulty);
    return `challenge-tone--${key}`;
  }

  challengeCardStatus(challenge: ChallengeWorkspaceCard): ChallengeCardStatus {
    if (!challenge.submission) {
      return 'not-started';
    }

    const normalized = (challenge.submission.status || '').toLowerCase();
    if (/(approved|complete|completed|accept|accepted|passed|success|done)/.test(normalized)) {
      return 'completed';
    }

    return 'in-progress';
  }

  challengeCardStatusClass(challenge: ChallengeWorkspaceCard): string {
    return `challenge-status-dot--${this.challengeCardStatus(challenge)}`;
  }

  challengeCardStatusText(challenge: ChallengeWorkspaceCard): string {
    return challenge.submission ? 'Submitted' : 'Not submitted yet';
  }

  challengeDetailStatus(challenge: ChallengeWorkspaceCard): ChallengeDetailStatus {
    if (!challenge.submission) {
      return 'in-progress';
    }

    const normalized = (challenge.submission.status || '').toLowerCase();
    if (/(review|pending_review|needs_review|pending)/.test(normalized)) {
      return 'needs-review';
    }

    return 'submitted';
  }

  challengeDetailStatusLabel(challenge: ChallengeWorkspaceCard): string {
    const status = this.challengeDetailStatus(challenge);
    if (status === 'needs-review') {
      return 'Needs Review';
    }
    if (status === 'submitted') {
      return 'Submitted';
    }
    return 'In Progress';
  }

  challengeDetailStatusClass(challenge: ChallengeWorkspaceCard): string {
    return `challenge-detail-status--${this.challengeDetailStatus(challenge)}`;
  }

  challengeThemeEmoji(challenge: ChallengeWorkspaceCard): string {
    const haystack = [
      challenge.title,
      challenge.description,
      ...(challenge.techStack || []),
    ]
      .join(' ')
      .toLowerCase();

    if (/(leaderboard|ranking|rank|scoreboard|competition|hackathon)/.test(haystack)) {
      return '🏆';
    }

    if (/(debug|bug|fix|troubleshoot|trace|diagnos)/.test(haystack)) {
      return '🔧';
    }

    if (/(performance|optimi|scale|high[- ]throughput|latency|advanced)/.test(haystack)) {
      return '🚀';
    }

    if (/(learn|tutorial|foundation|fundamental|guide|reading)/.test(haystack)) {
      return '📚';
    }

    return '🎯';
  }

  challengeCompletionBadges(challenge: ChallengeWorkspaceCard): string[] {
    const submission = challenge.submission;
    if (!submission) {
      return [];
    }

    const badges: string[] = [];
    const retryCount = Math.max(0, submission.retryCount || 0);
    if (retryCount === 0) {
      badges.push('First Try');
    }

    const score = this.toSafeScore(submission.score);
    if (score !== null && score >= 90) {
      badges.push('Code Quality Star');
    }

    const submittedAt = submission.submittedAt ? new Date(submission.submittedAt).getTime() : null;
    const createdAt = challenge.createdAt ? new Date(challenge.createdAt).getTime() : null;
    if (
      submittedAt &&
      createdAt &&
      Number.isFinite(submittedAt) &&
      Number.isFinite(createdAt)
    ) {
      const elapsedDays = Math.max(0, (submittedAt - createdAt) / (1000 * 60 * 60 * 24));
      const target = Math.max(1, challenge.estimatedDays || 1);
      if (elapsedDays <= Math.max(1, target * 0.55)) {
        badges.push('Speed Runner');
      }
    }

    return badges.slice(0, 3);
  }

  isLessonCompleted(index: number): boolean {
    return this.lessonCompletionState()[index] === true;
  }

  lessonStateLabel(index: number): string {
    if (this.isLessonCompleted(index)) {
      return 'Done';
    }

    if (index === this.activeLessonIndex()) {
      return 'Reading';
    }

    return 'Queued';
  }

  lessonPreview(lesson: NodeCourseLessonDto): string {
    const source = (lesson.explanation || lesson.miniExample || '').trim();
    if (!source) {
      return 'Open this page to start learning this concept.';
    }

    if (source.length <= 120) {
      return source;
    }

    return `${source.slice(0, 117).trimEnd()}...`;
  }

  isCourseTocActive(entry: CourseTocEntry): boolean {
    if (entry.type === 'section') {
      return false;
    }

    return this.activeCourseSectionKey() === entry.key;
  }

  openCourseTocEntry(entry: CourseTocEntry): void {
    if (entry.type === 'section') {
      return;
    }

    this.openCourseSectionByKey(entry.key, true);
  }

  courseSectionId(sectionKey: string): string {
    return sectionKey === 'lab' ? 'course-section-lab' : `course-section-${sectionKey}`;
  }

  onCourseContentScroll(event: Event): void {
    const container = event.target as HTMLElement | null;
    if (!container) {
      return;
    }

    const keys = this.courseNavigableKeys();
    if (keys.length === 0) {
      return;
    }

    const scrollProbe = container.scrollTop + 36;
    let activeKey = keys[0];

    for (const key of keys) {
      const section = this.document.getElementById(this.courseSectionId(key));
      if (!section) {
        continue;
      }

      if (section.offsetTop <= scrollProbe) {
        activeKey = key;
      }
    }

    this.syncCourseSectionSelection(activeKey, false);
  }

  lessonParagraphs(lesson: NodeCourseLessonDto): string[] {
    return this.parseLessonParagraphs(lesson.explanation || '');
  }

  copyCourseCodeBlock(blockKey: string, code: string): void {
    const normalized = (code || '').trim();
    if (!normalized) {
      this.errorMessage.set('No code is available to copy.');
      return;
    }

    this.copyToClipboard(normalized, 'Code snippet copied.');
    this.copiedCodeBlockKey.set(blockKey);

    if (this.copiedCodeTimer) {
      clearTimeout(this.copiedCodeTimer);
      this.copiedCodeTimer = null;
    }

    this.copiedCodeTimer = setTimeout(() => {
      this.copiedCodeBlockKey.set(null);
      this.copiedCodeTimer = null;
    }, 1300);
  }

  codeCopyLabel(blockKey: string): string {
    return this.copiedCodeBlockKey() === blockKey ? 'Copied' : 'Copy';
  }

  renderCodeWithHighlighting(code: string): string {
    return this.renderHighlightedCode(code || '');
  }

  isLabChecklistChecked(index: number): boolean {
    return this.labChecklistState()[index] === true;
  }

  toggleLabChecklist(index: number): void {
    this.labChecklistState.update((state) => ({
      ...state,
      [index]: !state[index],
    }));

    this.persistLabChecklistState();
  }

  isLabGuideStepCompleted(index: number): boolean {
    return this.labGuideCompletionState()[index] === true;
  }

  toggleLabGuideStepCompletion(index: number): void {
    const wasComplete = this.isLabGuideStepCompleted(index);

    this.labGuideCompletionState.update((state) => ({
      ...state,
      [index]: !wasComplete,
    }));

    this.persistLabGuideCompletionState();
    this.appendLabConsole(
      `Step ${index + 1} ${wasComplete ? 'marked incomplete' : 'validated as complete'}.`,
      wasComplete ? 'log' : 'success'
    );
  }

  markLabGuideStepComplete(index: number): void {
    this.labGuideCompletionState.update((state) => ({
      ...state,
      [index]: true,
    }));

    this.persistLabGuideCompletionState();
    this.appendLabConsole(`Mark as complete clicked for Step ${index + 1}.`, 'success');
  }

  clearLabConsole(): void {
    this.labConsoleLines.set([]);
  }

  setChatDraft(value: string): void {
    this.chatDraft.set(value || '');
  }

  createChatSession(): void {
    const now = new Date().toISOString();
    const nextId =
      this.chatSessions().reduce((maxId, session) => Math.max(maxId, session.id), 0) + 1;

    const session: ChatWorkspaceSession = {
      id: nextId,
      title: `Session ${nextId}`,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };

    this.chatSessions.update((sessions) => [session, ...sessions]);
    this.activeChatSessionId.set(nextId);
    this.persistChatSessions();
    this.persistActiveChatSessionId(nextId);
    this.errorMessage.set(null);
    this.setInfoMessage('New tutor chat session created.');
  }

  selectChatSession(sessionId: number): void {
    this.activeChatSessionId.set(sessionId);
    this.persistActiveChatSessionId(sessionId);
  }

  clearActiveChatSession(): void {
    const activeId = this.activeChatSessionId();
    if (!activeId) {
      return;
    }

    this.chatSessions.update((sessions) =>
      sessions.filter((session) => session.id !== activeId)
    );

    const nextActive = this.chatSessions()[0]?.id ?? null;
    this.activeChatSessionId.set(nextActive);
    this.persistChatSessions();
    this.persistActiveChatSessionId(nextActive);
    this.chatDraft.set('');
    this.setInfoMessage('Active tutor session cleared.');
  }

  submitChatPrompt(): void {
    const context = this.context();
    const session = this.activeChatSession();
    const prompt = this.chatDraft().trim();

    if (!context || !session) {
      this.errorMessage.set('Create or select a session before asking the tutor.');
      return;
    }

    if (!prompt) {
      this.errorMessage.set('Write a prompt before asking the tutor.');
      return;
    }

    const userMessage = this.createChatMessage('user', prompt, false);
    this.patchChatSession(session.id, (current) => ({
      ...current,
      title: this.resolveChatTitle(current.title, prompt),
      updatedAt: userMessage.createdAt,
      messages: [...current.messages, userMessage],
    }));

    this.chatDraft.set('');
    this.chatSending.set(true);
    this.errorMessage.set(null);

    this.roadmapApi
      .askNodeTutor(context.nodeId, context.userId, {
        prompt,
      })
      .pipe(finalize(() => this.chatSending.set(false)))
      .subscribe({
        next: (response) => {
          const assistantMessage = this.createChatMessage(
            'assistant',
            this.formatTutorAnswer(response),
            response.aiGenerated !== false
          );

          this.patchChatSession(session.id, (current) => ({
            ...current,
            updatedAt: assistantMessage.createdAt,
            messages: [...current.messages, assistantMessage],
          }));

          this.setInfoMessage('Tutor response received.');
        },
        error: (err: HttpErrorResponse) => {
          const httpMessage = this.extractHttpErrorMessage(err);
          const fallbackMessage = httpMessage
            ? `Tutor temporarily unavailable: ${httpMessage}`
            : 'Tutor temporarily unavailable. Retry in a moment with the same prompt.';

          const assistantMessage = this.createChatMessage('assistant', fallbackMessage, false);
          this.patchChatSession(session.id, (current) => ({
            ...current,
            updatedAt: assistantMessage.createdAt,
            messages: [...current.messages, assistantMessage],
          }));

          this.errorMessage.set('Tutor request failed; fallback guidance was added to this session.');
        },
      });
  }

  trackChatSession(_index: number, session: ChatWorkspaceSession): number {
    return session.id;
  }

  trackChatMessage(_index: number, message: ChatWorkspaceMessage): number {
    return message.id;
  }

  formatScore(value: number | null | undefined): string {
    const safe = this.toSafeScore(value);
    if (safe === null) {
      return 'N/A';
    }

    return `${Math.round(safe)}`;
  }

  formatScoreDelta(delta: number | null | undefined): string {
    const safe = this.toSafeScore(delta);
    if (safe === null) {
      return 'N/A';
    }

    if (safe > 0) {
      return `+${Math.round(safe)}`;
    }

    return `${Math.round(safe)}`;
  }

  scoreBarWidth(value: number | null | undefined): number {
    const safe = this.toSafeScore(value);
    if (safe === null) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round(safe)));
  }

  isPositiveScoreDelta(delta: number | null | undefined): boolean {
    const safe = this.toSafeScore(delta);
    return safe !== null && safe > 0;
  }

  isNegativeScoreDelta(delta: number | null | undefined): boolean {
    const safe = this.toSafeScore(delta);
    return safe !== null && safe < 0;
  }

  isNeutralScoreDelta(delta: number | null | undefined): boolean {
    const safe = this.toSafeScore(delta);
    return safe !== null && safe === 0;
  }

  jumpToLesson(rawIndex: string | number): void {
    const index = Number(rawIndex);
    if (!Number.isFinite(index)) {
      return;
    }

    this.openLesson(index, true);
  }

  toggleActiveLessonDone(): void {
    const index = this.activeLessonIndex();
    const wasDone = this.lessonCompletionState()[index] === true;

    this.lessonCompletionState.update((state) => ({
      ...state,
      [index]: !wasDone,
    }));

    this.persistLessonCompletionState();
    this.setInfoMessage(
      wasDone
        ? `Page ${index + 1} marked as not done.`
        : `Page ${index + 1} marked as done.`
    );
  }

  copyActiveLessonSnippet(): void {
    const snippet = this.activeLesson()?.codeSnippet || '';
    this.copyToClipboard(snippet, 'Lesson code snippet copied.');
  }

  copyStarterCode(): void {
    const starter = this.projectLab()?.starterCode || '';
    this.copyToClipboard(starter, 'Starter code copied.');
  }

  resetProjectSolutionToStarter(): void {
    const starter = this.projectLab()?.starterCode || '';
    if (!starter.trim()) {
      this.errorMessage.set('No starter code is available for this lab yet.');
      return;
    }

    this.projectSolutionDraft.set(starter);
    this.projectValidation.set(null);
    this.setInfoMessage('Solution reset to starter code.');
  }

  openActiveRepository(): void {
    const repoUrl = this.activeChallengeRepoUrl();
    if (!repoUrl) {
      this.errorMessage.set('No repository URL is available for this challenge yet.');
      return;
    }

    if (!this.isValidGithubRepositoryUrl(repoUrl)) {
      this.errorMessage.set('Repository URL must match https://github.com/username/repo.');
      return;
    }

    if (typeof window !== 'undefined') {
      window.open(repoUrl, '_blank', 'noopener');
    }
  }

  buildModeQuery(mode: WorkspaceMode): Record<string, string | number> {
    const context = this.context();
    if (!context) {
      return {};
    }

    const query: Record<string, string | number> = {
      mode,
      roadmapId: context.roadmapId,
      userId: context.userId,
      nodeId: context.nodeId,
      stepOrder: context.stepOrder,
      stepTitle: context.stepTitle,
      locked: context.locked ? 1 : 0,
    };

    if (context.stepStatus) {
      query['stepStatus'] = context.stepStatus;
    }

    if (mode === 'challenge') {
      const activeId = this.activeChallengeId();
      if (activeId) {
        query['challengeId'] = activeId;
      }
    }

    if (mode === 'chat') {
      const activeSessionId = this.activeChatSessionId();
      if (activeSessionId) {
        query['chatSessionId'] = activeSessionId;
      }
    }

    const historySource =
      mode === 'course' ? this.course() : mode === 'lab' ? this.projectLab() : null;

    if (historySource?.historyId) {
      query['historyId'] = historySource.historyId;
    }

    if (historySource?.generatedAt) {
      query['generatedAt'] = historySource.generatedAt;
    }

    return query;
  }

  openLesson(index: number, shouldScroll = false): void {
    const lessonCount = this.lessonCount();
    if (lessonCount === 0) {
      return;
    }

    const target = Math.max(0, Math.min(index, lessonCount - 1));
    const key = `page-${target}`;

    this.activeLessonIndex.set(target);
    this.activeCourseSectionKey.set(key);
    this.persistActiveLessonIndex(target);

    if (shouldScroll) {
      this.scrollToCourseSection(key);
    }
  }

  openPreviousLesson(): void {
    this.openCoursePageByIndex(this.activeCoursePageIndex() - 1);
  }

  openNextLesson(): void {
    this.openCoursePageByIndex(this.activeCoursePageIndex() + 1);
  }

  reloadCourse(refresh: boolean): void {
    const context = this.context();
    if (!context) {
      return;
    }

    this.loadCourseWorkspace({
      ...context,
      refresh,
    });

    this.loadCourseLabPreview(context);
  }

  selectCourseVersion(version: NodeCourseContentDto): void {
    const normalized = this.normalizeCoursePayload(version);
    this.course.set(normalized);
    this.activeLessonIndex.set(0);
    this.activeCourseSectionKey.set('page-0');
    this.persistActiveLessonIndex(0);
  }

  reloadProjectLab(refresh: boolean): void {
    const context = this.context();
    if (!context) {
      return;
    }

    this.loadLabWorkspace({
      ...context,
      refresh,
    });
  }

  selectProjectLabFromHistory(version: NodeProjectLabDto): void {
    this.applyProjectLab(version, this.projectLabHistory());
  }

  setProjectSolutionDraft(value: string): void {
    this.projectSolutionDraft.set(value);
    if (this.projectValidation()) {
      this.projectValidation.set(null);
    }
  }

  validateProjectSolution(): void {
    const context = this.context();
    const projectLab = this.projectLab();

    if (!context || !projectLab) {
      this.errorMessage.set('Project lab context is unavailable.');
      return;
    }

    const code = this.projectSolutionDraft().trim();
    if (!code) {
      this.errorMessage.set('Write or paste your solution code before validation.');
      return;
    }

    this.projectValidationLoading.set(true);

    this.roadmapApi
      .validateNodeProject(context.nodeId, context.userId, {
        projectTitle: projectLab.projectTitle,
        language: projectLab.language,
        acceptanceCriteria: projectLab.acceptanceCriteria,
        code,
      })
      .pipe(finalize(() => this.projectValidationLoading.set(false)))
      .subscribe({
        next: (validation) => {
          this.projectValidation.set(validation);
          this.errorMessage.set(null);
          this.setInfoMessage(
            validation.passed
              ? 'Validation passed. Great progress.'
              : 'Validation updated with improvement hints.'
          );
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(
            this.extractHttpErrorMessage(err) ||
              'Could not validate your project solution right now.'
          );
        },
      });
  }

  refreshChallenges(): void {
    const context = this.context();
    if (!context) {
      return;
    }

    this.loadChallengeWorkspace(
      {
        ...context,
        generate: false,
      },
      false
    );
  }

  generateNewChallenge(): void {
    const context = this.context();
    if (!context) {
      return;
    }

    this.loadChallengeWorkspace(
      {
        ...context,
        generate: true,
      },
      true
    );
  }

  selectChallenge(challengeId: number): void {
    this.activeChallengeId.set(challengeId);
    this.persistChallengeId(challengeId);
  }

  setActiveChallengeRepoUrl(value: string): void {
    const challenge = this.activeChallenge();
    if (!challenge) {
      return;
    }

    this.patchChallenge(challenge.id, {
      repoUrlDraft: value,
    });
  }

  canSubmitChallenge(challenge: ChallengeWorkspaceCard): boolean {
    if (!challenge.submission) {
      return true;
    }
    return challenge.submission.retryCount < this.maxSubmissionRetries;
  }

  formatSubmissionStatus(status: string | undefined): string {
    const normalized = (status || 'PENDING_REVIEW').toLowerCase().replace(/_/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  hasChallengeScores(challenge: ChallengeWorkspaceCard): boolean {
    const submission = challenge.submission;
    if (!submission) {
      return false;
    }

    return [
      submission.score,
      submission.readmeScore,
      submission.structureScore,
      submission.testScore,
      submission.ciScore,
    ].some((value) => typeof value === 'number');
  }

  submitActiveChallenge(): void {
    const context = this.context();
    const challenge = this.activeChallenge();
    if (!context || !challenge) {
      this.errorMessage.set('Select a challenge first.');
      return;
    }

    if (!this.canSubmitChallenge(challenge)) {
      this.errorMessage.set('Retry limit reached for this challenge submission.');
      return;
    }

    const repoUrl = (challenge.repoUrlDraft || challenge.submission?.repoUrl || '').trim();
    if (!repoUrl) {
      this.errorMessage.set('Add a repository URL before submitting this challenge.');
      return;
    }

    if (!this.isValidGithubRepositoryUrl(repoUrl)) {
      this.errorMessage.set('Repository URL must match https://github.com/username/repo.');
      return;
    }

    const request$ = challenge.submission
      ? this.roadmapApi.retryProjectSubmission(challenge.submission.id, { repoUrl })
      : this.roadmapApi.submitProject({
          userId: context.userId,
          projectSuggestionId: challenge.id,
          repoUrl,
        });

    const previousSubmission = challenge.submission;

    this.patchChallenge(challenge.id, {
      submitting: true,
    });

    request$
      .pipe(
        finalize(() => {
          this.patchChallenge(challenge.id, { submitting: false });
        })
      )
      .subscribe({
        next: (submission) => {
          this.patchChallenge(challenge.id, {
            submission,
            repoUrlDraft: submission.repoUrl || repoUrl,
            reviewText: submission.aiFeedback || challenge.reviewText,
          });
          this.recordChallengeScoreSnapshot(
            challenge.id,
            previousSubmission,
            submission,
            'submission'
          );
          this.errorMessage.set(null);
          this.setInfoMessage(
            challenge.submission ? 'Challenge resubmitted.' : 'Challenge submitted.'
          );

          if (!(submission.aiFeedback || '').trim()) {
            this.loadChallengeReview(challenge.id);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(
            this.extractHttpErrorMessage(err) ||
              'Could not submit this challenge right now.'
          );
        },
      });
  }

  loadActiveChallengeReview(): void {
    const challenge = this.activeChallenge();
    if (!challenge) {
      this.errorMessage.set('Select a challenge first.');
      return;
    }

    this.loadChallengeReview(challenge.id);
  }

  private loadChallengeReview(challengeId: number): void {
    const challenge = this.challenges().find((item) => item.id === challengeId);
    if (!challenge?.submission?.id) {
      this.errorMessage.set('Submit the challenge project before requesting review.');
      return;
    }

    this.patchChallenge(challengeId, { reviewLoading: true });

    this.roadmapApi
      .getProjectSubmissionReview(challenge.submission.id)
      .pipe(
        finalize(() => {
          this.patchChallenge(challengeId, { reviewLoading: false });
        })
      )
      .subscribe({
        next: (payload) => {
          const reviewText = (payload.review || '').trim();
          const previousSubmission = challenge.submission;
          const updatedSubmission: ProjectSubmissionDto = {
            ...challenge.submission!,
            status: payload.status || challenge.submission!.status,
            score: payload.score ?? challenge.submission!.score,
            readmeScore: payload.readmeScore ?? challenge.submission!.readmeScore,
            structureScore:
              payload.structureScore ?? challenge.submission!.structureScore,
            testScore: payload.testScore ?? challenge.submission!.testScore,
            ciScore: payload.ciScore ?? challenge.submission!.ciScore,
            recommendations:
              payload.recommendations ?? challenge.submission!.recommendations,
            reviewedAt: payload.reviewedAt || challenge.submission!.reviewedAt,
            aiFeedback: reviewText || challenge.submission!.aiFeedback,
          };

          this.patchChallenge(challengeId, {
            submission: updatedSubmission,
            reviewText:
              reviewText ||
              'No AI review text is available yet for this submission.',
          });
          this.recordChallengeScoreSnapshot(
            challengeId,
            previousSubmission,
            updatedSubmission,
            'review'
          );

          this.errorMessage.set(null);
          this.setInfoMessage('AI review loaded.');
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(
            this.extractHttpErrorMessage(err) ||
              'Could not load AI review right now.'
          );
        },
      });
  }

  private loadModeData(context: WorkspaceContext): void {
    this.errorMessage.set(null);

    if (context.mode === 'course') {
      if (context.locked) {
        this.courseLoading.set(false);
        this.courseLabLoading.set(false);
        this.course.set(null);
        this.courseHistory.set([]);
        this.activeCourseSectionKey.set('page-0');
        return;
      }

      this.loadCourseWorkspace(context);
      this.loadCourseLabPreview(context);
      return;
    }

    if (context.mode === 'lab') {
      this.loadLabWorkspace(context);
      return;
    }

    if (context.mode === 'chat') {
      this.loadChatWorkspace(context);
      return;
    }

    this.loadChallengeWorkspace(context, context.generate);
  }

  private loadChatWorkspace(context: WorkspaceContext): void {
    const sessions = this.readPersistedChatSessions(context);
    this.chatSessions.set(sessions);

    const preferredSessionId =
      context.chatSessionId ?? this.readPersistedActiveChatSessionId(context);
    const selectedSessionId =
      sessions.find((session) => session.id === preferredSessionId)?.id ||
      sessions[0]?.id ||
      null;

    this.activeChatSessionId.set(selectedSessionId);
    this.persistActiveChatSessionId(selectedSessionId);
    this.chatDraft.set('');
    this.chatSending.set(false);
  }

  private canUseStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  private buildStorageKey(context: WorkspaceContext, suffix: string): string {
    return `roadmap-workspace:${context.roadmapId}:${context.nodeId}:${context.stepOrder}:${context.userId}:${suffix}`;
  }

  private readPersistedLessonIndex(context: WorkspaceContext): number {
    if (!this.canUseStorage()) {
      return 0;
    }

    const raw = window.localStorage.getItem(this.buildStorageKey(context, 'course-active-lesson'));
    if (!raw) {
      return 0;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }

    return Math.floor(parsed);
  }

  private persistActiveLessonIndex(index: number): void {
    const context = this.context();
    if (!context || !this.canUseStorage()) {
      return;
    }

    window.localStorage.setItem(
      this.buildStorageKey(context, 'course-active-lesson'),
      String(Math.max(0, Math.floor(index)))
    );
  }

  private readPersistedLessonCompletion(context: WorkspaceContext): Record<number, boolean> {
    if (!this.canUseStorage()) {
      return {};
    }

    const raw = window.localStorage.getItem(
      this.buildStorageKey(context, 'course-lesson-completion')
    );
    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const normalized: Record<number, boolean> = {};

      for (const [key, value] of Object.entries(parsed || {})) {
        const index = Number(key);
        if (Number.isFinite(index) && index >= 0 && value === true) {
          normalized[Math.floor(index)] = true;
        }
      }

      return normalized;
    } catch {
      return {};
    }
  }

  private sanitizeLessonCompletionState(
    completion: Record<number, boolean>,
    lessonCount: number
  ): Record<number, boolean> {
    if (lessonCount <= 0) {
      return {};
    }

    const normalized: Record<number, boolean> = {};
    for (const [rawIndex, isDone] of Object.entries(completion)) {
      const index = Number(rawIndex);
      if (!Number.isFinite(index) || index < 0 || index >= lessonCount || isDone !== true) {
        continue;
      }
      normalized[Math.floor(index)] = true;
    }

    return normalized;
  }

  private persistLessonCompletionState(): void {
    const context = this.context();
    if (!context || !this.canUseStorage()) {
      return;
    }

    const normalized = this.sanitizeLessonCompletionState(
      this.lessonCompletionState(),
      this.lessonCount()
    );

    window.localStorage.setItem(
      this.buildStorageKey(context, 'course-lesson-completion'),
      JSON.stringify(normalized)
    );
  }

  private readPersistedLabChecklistState(context: WorkspaceContext): Record<number, boolean> {
    return this.readPersistedIndexedBooleanState(context, 'course-lab-checklist');
  }

  private readPersistedLabGuideCompletionState(
    context: WorkspaceContext
  ): Record<number, boolean> {
    return this.readPersistedIndexedBooleanState(context, 'course-lab-guide-completion');
  }

  private readPersistedIndexedBooleanState(
    context: WorkspaceContext,
    suffix: string
  ): Record<number, boolean> {
    if (!this.canUseStorage()) {
      return {};
    }

    const raw = window.localStorage.getItem(this.buildStorageKey(context, suffix));
    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const normalized: Record<number, boolean> = {};

      for (const [key, value] of Object.entries(parsed || {})) {
        const index = Number(key);
        if (Number.isFinite(index) && index >= 0 && value === true) {
          normalized[Math.floor(index)] = true;
        }
      }

      return normalized;
    } catch {
      return {};
    }
  }

  private persistLabChecklistState(): void {
    const context = this.context();
    if (!context || !this.canUseStorage()) {
      return;
    }

    const normalized = this.sanitizeIndexedCompletionState(
      this.labChecklistState(),
      this.projectLab()?.acceptanceCriteria?.length || 0
    );

    window.localStorage.setItem(
      this.buildStorageKey(context, 'course-lab-checklist'),
      JSON.stringify(normalized)
    );
  }

  private persistLabGuideCompletionState(): void {
    const context = this.context();
    if (!context || !this.canUseStorage()) {
      return;
    }

    const normalized = this.sanitizeIndexedCompletionState(
      this.labGuideCompletionState(),
      this.labGuideSteps().length
    );

    window.localStorage.setItem(
      this.buildStorageKey(context, 'course-lab-guide-completion'),
      JSON.stringify(normalized)
    );
  }

  private sanitizeIndexedCompletionState(
    completion: Record<number, boolean>,
    maxCount: number
  ): Record<number, boolean> {
    if (maxCount <= 0) {
      return {};
    }

    const normalized: Record<number, boolean> = {};
    for (const [rawIndex, isDone] of Object.entries(completion)) {
      const index = Number(rawIndex);
      if (!Number.isFinite(index) || index < 0 || index >= maxCount || isDone !== true) {
        continue;
      }

      normalized[Math.floor(index)] = true;
    }

    return normalized;
  }

  private readPersistedChallengeId(context: WorkspaceContext): number | null {
    if (!this.canUseStorage()) {
      return null;
    }

    const raw = window.localStorage.getItem(
      this.buildStorageKey(context, 'challenge-active-id')
    );
    const parsed = Number(raw);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return Math.floor(parsed);
  }

  private persistChallengeId(challengeId: number): void {
    const context = this.context();
    if (!context || !this.canUseStorage()) {
      return;
    }

    window.localStorage.setItem(
      this.buildStorageKey(context, 'challenge-active-id'),
      String(challengeId)
    );
  }

  private readPersistedChatSessions(context: WorkspaceContext): ChatWorkspaceSession[] {
    if (!this.canUseStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.buildStorageKey(context, 'chat-sessions'));
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      const sessions: ChatWorkspaceSession[] = [];
      for (const item of parsed) {
        if (!item || typeof item !== 'object') {
          continue;
        }

        const record = item as Record<string, unknown>;
        const id = Number(record['id']);
        if (!Number.isFinite(id) || id <= 0) {
          continue;
        }

        const createdAtRaw =
          typeof record['createdAt'] === 'string' && record['createdAt'].trim().length > 0
            ? record['createdAt']
            : new Date().toISOString();
        const updatedAtRaw =
          typeof record['updatedAt'] === 'string' && record['updatedAt'].trim().length > 0
            ? record['updatedAt']
            : createdAtRaw;
        const titleRaw =
          typeof record['title'] === 'string' && record['title'].trim().length > 0
            ? record['title'].trim()
            : `Session ${Math.floor(id)}`;

        const parsedMessages = Array.isArray(record['messages'])
          ? record['messages']
          : [];

        const messages: ChatWorkspaceMessage[] = parsedMessages
          .filter((message) => !!message && typeof message === 'object')
          .map((message, index) => {
            const messageRecord = message as Record<string, unknown>;
            const role: ChatWorkspaceMessage['role'] =
              messageRecord['role'] === 'assistant' ? 'assistant' : 'user';
            const content =
              typeof messageRecord['content'] === 'string'
                ? messageRecord['content'].trim()
                : '';
            const createdAt =
              typeof messageRecord['createdAt'] === 'string' &&
              messageRecord['createdAt'].trim().length > 0
                ? messageRecord['createdAt']
                : updatedAtRaw;
            const messageId =
              typeof messageRecord['id'] === 'number' && Number.isFinite(messageRecord['id'])
                ? messageRecord['id']
                : Math.floor(id) * 100000 + index;

            return {
              id: messageId,
              role,
              content,
              createdAt,
              aiGenerated:
                typeof messageRecord['aiGenerated'] === 'boolean'
                  ? messageRecord['aiGenerated']
                  : role === 'assistant',
            };
          })
          .filter((message) => message.content.length > 0);

        sessions.push({
          id: Math.floor(id),
          title: titleRaw,
          createdAt: createdAtRaw,
          updatedAt: updatedAtRaw,
          messages,
        });
      }

      return sessions.sort((left, right) => {
        const leftTs = new Date(left.updatedAt).getTime();
        const rightTs = new Date(right.updatedAt).getTime();
        return rightTs - leftTs;
      });
    } catch {
      return [];
    }
  }

  private persistChatSessions(): void {
    const context = this.context();
    if (!context || !this.canUseStorage()) {
      return;
    }

    window.localStorage.setItem(
      this.buildStorageKey(context, 'chat-sessions'),
      JSON.stringify(this.chatSessions())
    );
  }

  private readPersistedActiveChatSessionId(context: WorkspaceContext): number | null {
    if (!this.canUseStorage()) {
      return null;
    }

    const raw = window.localStorage.getItem(
      this.buildStorageKey(context, 'chat-active-id')
    );
    const parsed = Number(raw);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return Math.floor(parsed);
  }

  private persistActiveChatSessionId(sessionId: number | null): void {
    const context = this.context();
    if (!context || !this.canUseStorage()) {
      return;
    }

    const key = this.buildStorageKey(context, 'chat-active-id');
    if (!sessionId || sessionId <= 0) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, String(Math.floor(sessionId)));
  }

  private setInfoMessage(message: string | null, autoClearMs = 2600): void {
    this.infoMessage.set(message);

    if (this.infoTimer) {
      clearTimeout(this.infoTimer);
      this.infoTimer = null;
    }

    if (!message) {
      return;
    }

    this.infoTimer = setTimeout(() => {
      this.infoMessage.set(null);
      this.infoTimer = null;
    }, autoClearMs);
  }

  private copyToClipboard(value: string, successMessage: string): void {
    const content = (value || '').trim();
    if (!content) {
      this.errorMessage.set('Nothing to copy yet.');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(content)
        .then(() => {
          this.errorMessage.set(null);
          this.setInfoMessage(successMessage);
        })
        .catch(() => this.copyWithFallback(content, successMessage));
      return;
    }

    this.copyWithFallback(content, successMessage);
  }

  private copyWithFallback(value: string, successMessage: string): void {
    try {
      const textarea = this.document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';

      this.document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const copied = this.document.execCommand('copy');
      this.document.body.removeChild(textarea);

      if (!copied) {
        this.errorMessage.set('Clipboard copy failed. Copy manually from the editor.');
        return;
      }

      this.errorMessage.set(null);
      this.setInfoMessage(successMessage);
    } catch {
      this.errorMessage.set('Clipboard copy failed. Copy manually from the editor.');
    }
  }

  private loadCourseWorkspace(context: WorkspaceContext): void {
    this.courseLoading.set(true);

    this.roadmapApi
      .getNodeCourseHistory(context.nodeId, context.userId)
      .pipe(
        catchError(() => of([] as NodeCourseContentDto[])),
        switchMap((historyPayload) => {
          const normalizedHistory = (historyPayload || []).map((entry) =>
            this.normalizeCoursePayload(entry)
          );
          this.courseHistory.set(normalizedHistory);

          const selectedFromHistory = context.refresh
            ? null
            : this.pickCourseVersionFromContext(normalizedHistory, context);

          if (selectedFromHistory) {
            return of({
              course: selectedFromHistory,
              history: normalizedHistory,
            });
          }

          return this.roadmapApi
            .getNodeCourse(context.nodeId, context.userId, context.refresh)
            .pipe(
              map((course) => ({
                course: this.normalizeCoursePayload(course),
                history: normalizedHistory,
              }))
            );
        }),
        finalize(() => this.courseLoading.set(false))
      )
      .subscribe({
        next: ({ course, history }) => {
          this.course.set(course);
          this.courseHistory.set(this.mergeCourseHistory(course, history));

          const persistedIndex = this.readPersistedLessonIndex(context);
          const maxIndex = Math.max(0, (course.lessons?.length || 1) - 1);
          const activeIndex = Math.min(persistedIndex, maxIndex);
          this.activeLessonIndex.set(activeIndex);
          this.activeCourseSectionKey.set(`page-${activeIndex}`);
          this.persistActiveLessonIndex(activeIndex);

          const persistedCompletion = this.readPersistedLessonCompletion(context);
          const normalizedCompletion = this.sanitizeLessonCompletionState(
            persistedCompletion,
            course.lessons?.length || 0
          );
          this.lessonCompletionState.set(normalizedCompletion);
          this.persistLessonCompletionState();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(
            this.extractHttpErrorMessage(err) ||
              'Could not load this course workspace right now.'
          );
        },
      });
  }

  private loadCourseLabPreview(context: WorkspaceContext): void {
    this.courseLabLoading.set(true);

    this.roadmapApi
      .getNodeProjectLabHistory(context.nodeId, context.userId)
      .pipe(
        catchError(() => of([] as NodeProjectLabDto[])),
        switchMap((historyPayload) => {
          const history = historyPayload || [];
          if (history.length > 0) {
            return of({
              projectLab: history[0],
              history,
            });
          }

          return this.roadmapApi.getNodeProjectLab(context.nodeId, context.userId).pipe(
            map((projectLab) => ({
              projectLab,
              history,
            }))
          );
        }),
        finalize(() => this.courseLabLoading.set(false))
      )
      .subscribe({
        next: ({ projectLab, history }) => {
          const mergedHistory = this.mergeProjectLabHistory(projectLab, history);
          this.projectLab.set(projectLab);
          this.projectLabHistory.set(mergedHistory);
          this.hydrateLabProgressState(context, projectLab);
        },
        error: () => {
          this.projectLab.set(null);
          this.projectLabHistory.set([]);
          this.labChecklistState.set({});
          this.labGuideCompletionState.set({});
        },
      });
  }

  private loadLabWorkspace(context: WorkspaceContext): void {
    this.labLoading.set(true);

    this.roadmapApi
      .getNodeProjectLabHistory(context.nodeId, context.userId)
      .pipe(
        catchError(() => of([] as NodeProjectLabDto[])),
        switchMap((historyPayload) => {
          const history = historyPayload || [];
          this.projectLabHistory.set(history);

          const selectedFromHistory = context.refresh
            ? null
            : this.pickProjectLabFromContext(history, context);

          if (selectedFromHistory) {
            return of({
              projectLab: selectedFromHistory,
              history,
            });
          }

          return this.roadmapApi
            .getNodeProjectLab(context.nodeId, context.userId)
            .pipe(map((projectLab) => ({ projectLab, history })));
        }),
        finalize(() => this.labLoading.set(false))
      )
      .subscribe({
        next: ({ projectLab, history }) => {
          const mergedHistory = this.mergeProjectLabHistory(projectLab, history);
          this.applyProjectLab(projectLab, mergedHistory);
          this.hydrateLabProgressState(context, projectLab);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(
            this.extractHttpErrorMessage(err) ||
              'Could not load this project lab right now.'
          );
        },
      });
  }

  private loadChallengeWorkspace(context: WorkspaceContext, generate: boolean): void {
    this.challengesLoading.set(true);

    const suggestions$ = generate
      ? this.roadmapApi
          .generateProjectSuggestionsByRoadmapStep(
            context.roadmapId,
            context.stepOrder,
            context.stepTitle,
            'INTERMEDIATE'
          )
          .pipe(
            switchMap((generated) =>
              this.roadmapApi
                .getProjectSuggestionsByRoadmapStep(context.roadmapId, context.stepOrder)
                .pipe(
                  map((history) => (history.length > 0 ? history : generated)),
                  catchError(() => of(generated))
                )
            )
          )
      : this.roadmapApi.getProjectSuggestionsByRoadmapStep(
          context.roadmapId,
          context.stepOrder
        );

    forkJoin({
      suggestions: suggestions$.pipe(catchError(() => of([] as ProjectSuggestionDto[]))),
      submissions: this.roadmapApi
        .getUserProjectSubmissions(context.userId)
        .pipe(catchError(() => of([] as ProjectSubmissionDto[]))),
    })
      .pipe(finalize(() => this.challengesLoading.set(false)))
      .subscribe({
        next: ({ suggestions, submissions }) => {
          const cards = this.toChallengeCards(
            suggestions,
            submissions,
            this.challenges()
          );
          this.challenges.set(cards);
          this.seedChallengeScoreSnapshots(cards);

          const filteredCards = this.applyChallengeFilters(cards);
          const selectionPool = filteredCards.length > 0 ? filteredCards : cards;

          const preferredId = context.challengeId ?? this.activeChallengeId();
          const selected =
            selectionPool.find((challenge) => challenge.id === preferredId) ||
            selectionPool[0] ||
            null;
          this.activeChallengeId.set(selected?.id ?? null);

          if (selected?.id) {
            this.persistChallengeId(selected.id);
          }

          if (cards.length === 0 && generate) {
            this.errorMessage.set('No challenge was generated for this node. Try again.');
          }
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(
            this.extractHttpErrorMessage(err) ||
              'Could not load challenge workspace right now.'
          );
        },
      });
  }

  private filterChallengesByDifficulty(
    challenges: ChallengeWorkspaceCard[],
    filter: ChallengeFilter
  ): ChallengeWorkspaceCard[] {
    if (filter === 'all') {
      return challenges;
    }

    return challenges.filter((challenge) => this.toChallengeDifficultyKey(challenge.difficulty) === filter);
  }

  private applyChallengeFilters(challenges: ChallengeWorkspaceCard[]): ChallengeWorkspaceCard[] {
    const byDifficulty = this.filterChallengesByDifficulty(challenges, this.challengeFilter());
    const statusFilter = this.challengeStatusFilter();
    const query = this.challengeSearchQuery().trim().toLowerCase();

    return byDifficulty.filter((challenge) => {
      if (statusFilter !== 'all' && this.challengeCardStatus(challenge) !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchText = [
        challenge.title,
        challenge.description,
        this.challengeDifficultyLabel(challenge),
        this.challengeCardStatusText(challenge),
        this.challengeDetailStatusLabel(challenge),
        ...(challenge.techStack || []),
      ]
        .join(' ')
        .toLowerCase();

      return searchText.includes(query);
    });
  }

  private reconcileActiveChallengeSelection(): void {
    const filtered = this.filteredChallenges();
    if (filtered.length === 0) {
      this.activeChallengeId.set(null);
      return;
    }

    const active = this.activeChallengeId();
    if (!active || !filtered.some((challenge) => challenge.id === active)) {
      this.selectChallenge(filtered[0].id);
    }
  }

  private toChallengeDifficultyKey(
    rawDifficulty: string | null | undefined
  ): Exclude<ChallengeFilter, 'all'> {
    const normalized = (rawDifficulty || '').trim().toLowerCase();
    if (/(advanced|expert|senior)/.test(normalized)) {
      return 'advanced';
    }

    if (/(intermediate|medium)/.test(normalized)) {
      return 'intermediate';
    }

    return 'beginner';
  }

  private isValidGithubRepositoryUrl(value: string): boolean {
    const normalized = (value || '').trim();
    if (!normalized) {
      return false;
    }

    try {
      const parsed = new URL(normalized);
      const host = parsed.hostname.toLowerCase();
      if (parsed.protocol !== 'https:' || (host !== 'github.com' && host !== 'www.github.com')) {
        return false;
      }

      const parts = parsed.pathname
        .split('/')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

      if (parts.length < 2) {
        return false;
      }

      const owner = parts[0];
      const repo = parts[1].replace(/\.git$/i, '');
      const validPart = /^[A-Za-z0-9._-]+$/;
      return validPart.test(owner) && validPart.test(repo);
    } catch {
      return false;
    }
  }

  private openCoursePageByIndex(index: number): void {
    const keys = this.courseNavigableKeys();
    if (keys.length === 0) {
      return;
    }

    const target = Math.max(0, Math.min(index, keys.length - 1));
    this.openCourseSectionByKey(keys[target], true);
  }

  private openCourseSectionByKey(sectionKey: string, shouldScroll: boolean): void {
    if (sectionKey === 'lab') {
      this.activeCourseSectionKey.set('lab');
      if (shouldScroll) {
        this.scrollToCourseSection('lab');
      }
      return;
    }

    const lessonIndex = this.toLessonIndexFromSectionKey(sectionKey);
    if (lessonIndex === null) {
      return;
    }

    this.openLesson(lessonIndex, shouldScroll);
  }

  private syncCourseSectionSelection(sectionKey: string, persistLessonIndex: boolean): void {
    if (sectionKey === 'lab') {
      this.activeCourseSectionKey.set('lab');
      return;
    }

    const lessonIndex = this.toLessonIndexFromSectionKey(sectionKey);
    if (lessonIndex === null) {
      return;
    }

    this.activeCourseSectionKey.set(sectionKey);

    if (this.activeLessonIndex() !== lessonIndex) {
      this.activeLessonIndex.set(lessonIndex);
      if (persistLessonIndex) {
        this.persistActiveLessonIndex(lessonIndex);
      }
    }
  }

  private toLessonIndexFromSectionKey(sectionKey: string): number | null {
    if (!sectionKey.startsWith('page-')) {
      return null;
    }

    const index = Number(sectionKey.slice(5));
    if (!Number.isFinite(index) || index < 0) {
      return null;
    }

    return Math.floor(index);
  }

  private scrollToCourseSection(sectionKey: string): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    view.setTimeout(() => {
      const container = this.document.getElementById('course-content-scroll');
      const section = this.document.getElementById(this.courseSectionId(sectionKey));
      if (!container || !section) {
        return;
      }

      container.scrollTo({
        top: Math.max(0, section.offsetTop - 12),
        behavior: 'smooth',
      });
    }, 0);
  }

  private hydrateLabProgressState(context: WorkspaceContext, projectLab: NodeProjectLabDto): void {
    const checklist = this.sanitizeIndexedCompletionState(
      this.readPersistedLabChecklistState(context),
      projectLab.acceptanceCriteria?.length || 0
    );
    this.labChecklistState.set(checklist);
    this.persistLabChecklistState();

    const guide = this.sanitizeIndexedCompletionState(
      this.readPersistedLabGuideCompletionState(context),
      this.labGuideSteps().length
    );
    this.labGuideCompletionState.set(guide);
    this.persistLabGuideCompletionState();
  }

  private parseLessonParagraphs(content: string): string[] {
    const normalized = (content || '').replace(/\r/g, '').trim();
    if (!normalized) {
      return [];
    }

    return normalized
      .split(/\n{2,}/)
      .map((block) => block.trim().replace(/\n/g, ' '))
      .filter((block) => block.length > 0);
  }

  private parseLessonExplanationBlocks(lesson: NodeCourseLessonDto): CourseTextBlock[] {
    const explanation = (lesson.explanation || '').replace(/\r/g, '').trim();
    if (!explanation) {
      return [
        {
          type: 'paragraph',
          text: 'Open this section to start this lesson.',
        },
      ];
    }

    const lines = explanation.split('\n');
    const blocks: CourseTextBlock[] = [];

    let listType: 'bulleted' | 'numbered' | null = null;
    let listItems: string[] = [];

    const flushList = () => {
      if (!listType || listItems.length === 0) {
        listType = null;
        listItems = [];
        return;
      }

      blocks.push({
        type: listType,
        items: [...listItems],
      });

      listType = null;
      listItems = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        flushList();
        continue;
      }

      const bulletMatch = line.match(/^[-*]\s+(.+)/);
      if (bulletMatch) {
        if (listType !== 'bulleted') {
          flushList();
          listType = 'bulleted';
        }
        listItems.push(bulletMatch[1].trim());
        continue;
      }

      const numberedMatch = line.match(/^\d+\.\s+(.+)/);
      if (numberedMatch) {
        if (listType !== 'numbered') {
          flushList();
          listType = 'numbered';
        }
        listItems.push(numberedMatch[1].trim());
        continue;
      }

      flushList();

      if (line.startsWith('### ')) {
        blocks.push({ type: 'heading3', text: line.slice(4).trim() });
        continue;
      }

      if (line.startsWith('## ')) {
        blocks.push({ type: 'heading2', text: line.slice(3).trim() });
        continue;
      }

      if (line.startsWith('# ')) {
        blocks.push({ type: 'heading1', text: line.slice(2).trim() });
        continue;
      }

      blocks.push({
        type: 'paragraph',
        text: line,
      });
    }

    flushList();
    return blocks;
  }

  private toLabUserStory(story: string, index: number): LabUserStoryCard {
    const normalized = (story || '').trim();
    if (!normalized) {
      return {
        title: `Story ${index + 1}`,
        description: 'Implement this user-facing behavior in your lab solution.',
      };
    }

    const colonIndex = normalized.indexOf(':');
    if (colonIndex > 0 && colonIndex < normalized.length - 1) {
      return {
        title: normalized.slice(0, colonIndex).trim(),
        description: normalized.slice(colonIndex + 1).trim(),
      };
    }

    const dashIndex = normalized.indexOf(' - ');
    if (dashIndex > 0 && dashIndex < normalized.length - 3) {
      return {
        title: normalized.slice(0, dashIndex).trim(),
        description: normalized.slice(dashIndex + 3).trim(),
      };
    }

    return {
      title: `Story ${index + 1}`,
      description: normalized,
    };
  }

  private extractInlineCode(text: string): string {
    const inline = text.match(/`([^`]+)`/);
    if (inline?.[1]) {
      return inline[1].trim();
    }

    const command = text.match(/\b(?:npm|pnpm|yarn|ng|node|java|mvn)\s+[^,.;]+/i);
    return command ? command[0].trim() : '';
  }

  private deriveExpectedOutput(instruction: string): string {
    const normalized = instruction.trim();
    const lower = normalized.toLowerCase();

    const shouldIndex = lower.indexOf('should ');
    if (shouldIndex >= 0) {
      return normalized.slice(shouldIndex).replace(/^should\s+/i, '').trim();
    }

    if (lower.includes('error')) {
      return 'No runtime errors should be visible in the console output.';
    }

    if (lower.includes('display') || lower.includes('render') || lower.includes('show')) {
      return 'The expected UI or terminal output should be visible after this step.';
    }

    return '';
  }

  private renderHighlightedCode(code: string): string {
    const source = code || '';
    if (!source.trim()) {
      return '';
    }

    const keywords = new Set([
      'const',
      'let',
      'var',
      'function',
      'return',
      'if',
      'else',
      'for',
      'while',
      'class',
      'interface',
      'import',
      'from',
      'new',
      'public',
      'private',
      'protected',
      'async',
      'await',
      'true',
      'false',
      'null',
      'undefined',
      'try',
      'catch',
      'switch',
      'case',
    ]);

    const tokenRegex =
      /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b)/g;

    let html = '';
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(source)) !== null) {
      const token = match[0];
      html += this.escapeHtml(source.slice(cursor, match.index));

      let tokenClass = '';
      if (/^"(?:[^"\\]|\\.)*"$/.test(token) || /^'(?:[^'\\]|\\.)*'$/.test(token) || /^`(?:[^`\\]|\\.)*`$/.test(token)) {
        tokenClass = 'workspace-code-token--string';
      } else if (/^\d+(?:\.\d+)?$/.test(token)) {
        tokenClass = 'workspace-code-token--number';
      } else if (keywords.has(token)) {
        tokenClass = 'workspace-code-token--keyword';
      }

      const escaped = this.escapeHtml(token);
      html += tokenClass ? `<span class="workspace-code-token ${tokenClass}">${escaped}</span>` : escaped;
      cursor = match.index + token.length;
    }

    html += this.escapeHtml(source.slice(cursor));
    return html;
  }

  private escapeHtml(content: string): string {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private appendLabConsole(text: string, tone: 'log' | 'success' | 'error'): void {
    const normalized = (text || '').trim();
    if (!normalized) {
      return;
    }

    const stamp = new Date().toLocaleTimeString();
    const line: LabConsoleLine = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      tone,
      text: `[${stamp}] ${normalized}`,
    };

    this.labConsoleLines.update((lines) => [...lines, line].slice(-180));
    this.scrollLabConsoleToLatest();
  }

  private scrollLabConsoleToLatest(): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    view.setTimeout(() => {
      const panel = this.document.getElementById('course-lab-console-output');
      if (!panel) {
        return;
      }

      panel.scrollTop = panel.scrollHeight;
    }, 0);
  }

  private parseWorkspaceContext(): WorkspaceContext | null {
    const params = this.route.snapshot.queryParamMap;
    const modeParam = params.get('mode');
    const mode: WorkspaceMode =
      modeParam === 'lab' || modeParam === 'challenge' || modeParam === 'chat'
        ? modeParam
        : 'course';

    const roadmapId = this.toPositiveInt(params.get('roadmapId'));
    const nodeId = this.toPositiveInt(params.get('nodeId'));
    const stepOrder = this.toPositiveInt(params.get('stepOrder')) ?? 1;
    const userId = this.toPositiveInt(params.get('userId')) ?? resolveRoadmapUserId();
    const stepStatus = (params.get('stepStatus') || '').trim().toUpperCase() || null;
    const locked = this.toBooleanFlag(params.get('locked')) || stepStatus === 'LOCKED';

    if (!roadmapId || !nodeId || !userId) {
      return null;
    }

    const stepTitle = (params.get('stepTitle') || `Step ${stepOrder}`).trim();

    return {
      mode,
      roadmapId,
      userId,
      nodeId,
      stepOrder,
      stepTitle,
      stepStatus,
      locked,
      refresh: this.toBooleanFlag(params.get('refresh')),
      generate: this.toBooleanFlag(params.get('generate')),
      historyId: this.toPositiveInt(params.get('historyId')),
      generatedAt: params.get('generatedAt'),
      challengeId: this.toPositiveInt(params.get('challengeId')),
      chatSessionId: this.toPositiveInt(params.get('chatSessionId')),
    };
  }

  private toChallengeCards(
    suggestions: ProjectSuggestionDto[],
    submissions: ProjectSubmissionDto[],
    existing: ChallengeWorkspaceCard[]
  ): ChallengeWorkspaceCard[] {
    const bySuggestion: Record<number, ProjectSubmissionDto> = {};

    for (const submission of submissions || []) {
      if (!submission?.projectSuggestionId) {
        continue;
      }

      const current = bySuggestion[submission.projectSuggestionId];
      if (!current) {
        bySuggestion[submission.projectSuggestionId] = submission;
        continue;
      }

      const currentTime = current.submittedAt ? new Date(current.submittedAt).getTime() : 0;
      const nextTime = submission.submittedAt ? new Date(submission.submittedAt).getTime() : 0;
      if (nextTime >= currentTime) {
        bySuggestion[submission.projectSuggestionId] = submission;
      }
    }

    const existingById = new Map(existing.map((challenge) => [challenge.id, challenge]));

    const sortedSuggestions = [...(suggestions || [])].sort((left, right) => {
      const rightRaw = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      const leftRaw = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTs = Number.isFinite(rightRaw) ? rightRaw : 0;
      const leftTs = Number.isFinite(leftRaw) ? leftRaw : 0;
      if (rightTs !== leftTs) {
        return rightTs - leftTs;
      }
      return (right.id || 0) - (left.id || 0);
    });

    return sortedSuggestions.map((suggestion) => {
      const existingCard = existingById.get(suggestion.id);
      const submission = bySuggestion[suggestion.id] || existingCard?.submission || null;
      const repoUrlDraft = existingCard?.repoUrlDraft || submission?.repoUrl || '';

      return {
        id: suggestion.id,
        createdAt: suggestion.createdAt,
        title: suggestion.title,
        description: suggestion.description,
        estimatedDays: suggestion.estimatedDays,
        difficulty: suggestion.difficulty,
        techStack: suggestion.techStack || [],
        repoUrlDraft,
        submission,
        submitting: existingCard?.submitting ?? false,
        reviewLoading: existingCard?.reviewLoading ?? false,
        reviewText: existingCard?.reviewText || submission?.aiFeedback || null,
      };
    });
  }

  private patchChallenge(challengeId: number, patch: Partial<ChallengeWorkspaceCard>): void {
    this.challenges.update((challenges) =>
      challenges.map((challenge) =>
        challenge.id === challengeId
          ? {
              ...challenge,
              ...patch,
            }
          : challenge
      )
    );
  }

  private seedChallengeScoreSnapshots(challenges: ChallengeWorkspaceCard[]): void {
    const next = { ...this.challengeScoreSnapshots() };

    for (const challenge of challenges) {
      if ((next[challenge.id] || []).length > 0) {
        continue;
      }

      const score = this.toSafeScore(challenge.submission?.score);
      if (!challenge.submission || score === null) {
        continue;
      }

      next[challenge.id] = [
        {
          source: 'submission',
          capturedAt:
            challenge.submission.reviewedAt ||
            challenge.submission.submittedAt ||
            new Date().toISOString(),
          previous: score,
          current: score,
          delta: 0,
          retryCount: challenge.submission.retryCount ?? null,
        },
      ];
    }

    this.challengeScoreSnapshots.set(next);
  }

  private recordChallengeScoreSnapshot(
    challengeId: number,
    previousSubmission: ProjectSubmissionDto | null | undefined,
    currentSubmission: ProjectSubmissionDto,
    source: 'submission' | 'review'
  ): void {
    const previousScore = this.toSafeScore(previousSubmission?.score);
    const currentScore = this.toSafeScore(currentSubmission.score);

    if (currentScore === null) {
      return;
    }

    const previousValue = previousScore ?? currentScore;
    const delta = currentScore - previousValue;
    const entry: ChallengeScoreHistoryEntry = {
      source,
      capturedAt:
        currentSubmission.reviewedAt ||
        currentSubmission.submittedAt ||
        new Date().toISOString(),
      previous: previousValue,
      current: currentScore,
      delta,
      retryCount: currentSubmission.retryCount ?? null,
    };

    this.challengeScoreSnapshots.update((snapshots) => {
      const next = { ...snapshots };
      const history = [...(next[challengeId] || [])];
      const last = history[history.length - 1];

      if (
        last &&
        last.current === entry.current &&
        last.retryCount === entry.retryCount &&
        last.source === entry.source
      ) {
        return snapshots;
      }

      history.push(entry);
      next[challengeId] = history.slice(-8);
      return next;
    });
  }

  private pickCourseVersionFromContext(
    history: NodeCourseContentDto[],
    context: WorkspaceContext
  ): NodeCourseContentDto | null {
    if (history.length === 0) {
      return null;
    }

    if (context.historyId) {
      const byId = history.find((entry) => entry.historyId === context.historyId);
      if (byId) {
        return byId;
      }
    }

    if (context.generatedAt) {
      const byDate = history.find((entry) => entry.generatedAt === context.generatedAt);
      if (byDate) {
        return byDate;
      }
    }

    return history[0];
  }

  private mergeCourseHistory(
    latest: NodeCourseContentDto,
    history: NodeCourseContentDto[]
  ): NodeCourseContentDto[] {
    return [latest, ...(history || [])].filter(
      (entry, index, all) =>
        all.findIndex(
          (candidate) =>
            (candidate.historyId && entry.historyId && candidate.historyId === entry.historyId) ||
            (!!candidate.generatedAt && candidate.generatedAt === entry.generatedAt) ||
            (!candidate.historyId && !entry.historyId &&
              !candidate.generatedAt && !entry.generatedAt &&
              candidate.courseTitle === entry.courseTitle && candidate.nodeId === entry.nodeId)
        ) === index
    );
  }

  private normalizeCoursePayload(course: NodeCourseContentDto): NodeCourseContentDto {
    return {
      ...course,
      courseTitle: course.courseTitle || `${course.nodeTitle || 'Node'} Course`,
      intro: course.intro || 'Practical node course.',
      difficulty: course.difficulty || 'BEGINNER',
      lessons: (course.lessons || []).map((lesson) => ({
        ...lesson,
        sectionTitle: lesson.sectionTitle || 'Lesson',
        explanation: lesson.explanation || 'Practice this concept with a small example.',
        miniExample: lesson.miniExample || '',
        codeSnippet: lesson.codeSnippet || '',
        commonPitfalls: lesson.commonPitfalls || [],
        practiceTasks: lesson.practiceTasks || [],
      })),
      checkpoints: (course.checkpoints || []).map((checkpoint) => ({
        question: checkpoint.question || 'Checkpoint question',
        answerHint: checkpoint.answerHint || 'Use a practical explanation.',
      })),
      cheatSheet: course.cheatSheet || [],
      nextNodeFocus: course.nextNodeFocus || '',
    };
  }

  private pickProjectLabFromContext(
    history: NodeProjectLabDto[],
    context: WorkspaceContext
  ): NodeProjectLabDto | null {
    if (history.length === 0) {
      return null;
    }

    if (context.historyId) {
      const byId = history.find((entry) => entry.historyId === context.historyId);
      if (byId) {
        return byId;
      }
    }

    if (context.generatedAt) {
      const byDate = history.find((entry) => entry.generatedAt === context.generatedAt);
      if (byDate) {
        return byDate;
      }
    }

    return history[0];
  }

  private mergeProjectLabHistory(
    latest: NodeProjectLabDto,
    history: NodeProjectLabDto[]
  ): NodeProjectLabDto[] {
    return [latest, ...(history || [])].filter(
      (entry, index, all) =>
        all.findIndex((candidate) => this.sameProjectLabHistoryEntry(candidate, entry)) === index
    );
  }

  private applyProjectLab(projectLab: NodeProjectLabDto, history: NodeProjectLabDto[]): void {
    this.projectLab.set(projectLab);
    this.projectLabHistory.set(history);
    this.projectSolutionDraft.set(projectLab.starterCode || '');
    this.projectValidation.set(null);
  }

  private sameProjectLabHistoryEntry(left: NodeProjectLabDto, right: NodeProjectLabDto): boolean {
    if (left.historyId && right.historyId) {
      return left.historyId === right.historyId;
    }

    const leftGeneratedAt = left.generatedAt || '';
    const rightGeneratedAt = right.generatedAt || '';
    if (leftGeneratedAt && rightGeneratedAt) {
      return leftGeneratedAt === rightGeneratedAt;
    }

    return left.projectTitle === right.projectTitle && left.language === right.language;
  }

  private patchChatSession(
    sessionId: number,
    updater: (session: ChatWorkspaceSession) => ChatWorkspaceSession
  ): void {
    let found = false;

    this.chatSessions.update((sessions) =>
      sessions.map((session) => {
        if (session.id !== sessionId) {
          return session;
        }

        found = true;
        return updater(session);
      })
    );

    if (!found) {
      return;
    }

    this.persistChatSessions();
    this.persistActiveChatSessionId(sessionId);
  }

  private createChatMessage(
    role: 'user' | 'assistant',
    content: string,
    aiGenerated: boolean
  ): ChatWorkspaceMessage {
    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      role,
      content,
      createdAt: new Date().toISOString(),
      aiGenerated,
    };
  }

  private resolveChatTitle(currentTitle: string, prompt: string): string {
    if (!currentTitle.startsWith('Session ')) {
      return currentTitle;
    }

    const cleaned = prompt.trim();
    if (!cleaned) {
      return currentTitle;
    }

    return cleaned.length <= 42 ? cleaned : `${cleaned.slice(0, 39).trimEnd()}...`;
  }

  private formatTutorAnswer(response: NodeTutorPromptResponseDto): string {
    const answer = (response.answer || '').trim();
    const takeaways = (response.keyTakeaways || []).filter((item) => !!(item || '').trim());
    const actions = (response.nextActions || []).filter((item) => !!(item || '').trim());

    const blocks: string[] = [];
    blocks.push(answer || 'Tutor returned an empty response. Try rephrasing your prompt.');

    if (takeaways.length > 0) {
      blocks.push('Key takeaways:');
      for (const takeaway of takeaways) {
        blocks.push(`- ${takeaway}`);
      }
    }

    if (actions.length > 0) {
      blocks.push('Next actions:');
      for (const action of actions) {
        blocks.push(`- ${action}`);
      }
    }

    return blocks.join('\n');
  }

  private toSafeScore(value: number | null | undefined): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null;
    }

    return value;
  }

  private extractHttpErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    const payload = error.error as { message?: string; error?: string } | null;
    if (payload?.message) {
      return payload.message;
    }
    if (payload?.error) {
      return payload.error;
    }

    return error.message || '';
  }

  private toPositiveInt(value: string | null): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return Math.floor(parsed);
  }

  private toBooleanFlag(value: string | null): boolean {
    return value === '1' || value === 'true';
  }
}
