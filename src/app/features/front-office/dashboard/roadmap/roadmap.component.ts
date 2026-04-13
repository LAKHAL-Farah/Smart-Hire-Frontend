import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';
import {
  RoadmapApiService,
  RoadmapResponse,
  RoadmapVisualResponse,
  StepResourceDto,
  StepResponse,
} from '../../../../services/roadmap-api.service';
import { resolveRoadmapUserId } from './roadmap-user-context';

interface ResourceCard {
  type: 'video' | 'article' | 'course';
  title: string;
  source: string;
  url: string;
  isFree: boolean;
  origin: 'roadmap' | 'ai';
}

interface ResourceBuckets {
  free: ResourceCard[];
  premium: ResourceCard[];
  aiTutor: ResourceCard[];
}

interface Step {
  number: number;
  title: string;
  description: string;
  status: 'done' | 'in-progress' | 'pending';
  backendStatus: string;
  estimatedTime: string;
  resources: ResourceCard[];
  resourcesLoaded: boolean;
  resourcesLoading: boolean;
  nodeId?: number;
  completionType: 'node' | 'step';
}

type FilterTab = 'all' | 'todo' | 'in-progress' | 'completed';
type ResourcePanelTab = 'resources' | 'ai-tutor';

interface NodeQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

interface NodeQuizSession {
  stepNumber: number;
  stepTitle: string;
  questions: NodeQuizQuestion[];
  activeQuestionIndex: number;
  selectedAnswers: Record<string, number | null>;
  passThreshold: number;
  submitted: boolean;
  scorePercent: number | null;
  passed: boolean;
  feedback: string | null;
}

interface NodeQuizStorageState {
  passedByStep: Record<string, boolean>;
  scoreByStep: Record<string, number>;
  seenQuestionIdsByStep: Record<string, string[]>;
  attemptByStep: Record<string, number>;
}

interface NodeQuizTemplate {
  id: string;
  prompt: string;
  correct: string;
  distractors: string[];
}

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule, RouterLink, LUCIDE_ICONS],
  templateUrl: './roadmap.component.html',
  styleUrl: './roadmap.component.scss',
})
export class RoadmapComponent implements OnInit, OnDestroy {
  private readonly roadmapApi = inject(RoadmapApiService);
  private readonly document = inject(DOCUMENT);
  private readonly quizPassThreshold = 70;
  private readonly quizQuestionCount = 5;
  private previousBodyOverflow: string | null = null;

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  activeFilter = signal<FilterTab>('all');
  activeResourceTab = signal<ResourcePanelTab>('resources');
  expandedStep = signal<number | null>(null);
  quizSession = signal<NodeQuizSession | null>(null);

  private readonly quizPassedState = signal<Record<string, boolean>>({});
  private readonly quizScoresState = signal<Record<string, number>>({});
  private readonly quizSeenQuestionIdsState = signal<Record<string, string[]>>({});
  private readonly quizAttemptCountState = signal<Record<string, number>>({});

  private readonly activeRoadmap = signal<RoadmapResponse | null>(null);
  private readonly currentUserId = signal<number | null>(null);
  private readonly stepsState = signal<Step[]>([]);

  filterTabs: { label: string; value: FilterTab }[] = [
    { label: 'All Steps', value: 'all' },
    { label: 'To Do', value: 'todo' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' },
  ];

  get steps(): Step[] {
    return this.stepsState();
  }

  get completedCount(): number {
    return this.stepsState().filter((step) => step.status === 'done').length;
  }

  roadmapTitle = computed(
    () => this.activeRoadmap()?.title || 'My Learning Roadmap'
  );

  roadmapSubtitle = computed(() => {
    const roadmap = this.activeRoadmap();
    if (!roadmap) {
      return 'Loading your personalized roadmap...';
    }

    const parts: string[] = [];
    if (roadmap.careerPath?.title) {
      parts.push(roadmap.careerPath.title);
    }
    if (roadmap.estimatedWeeks && roadmap.estimatedWeeks > 0) {
      parts.push(`Estimated ${roadmap.estimatedWeeks} weeks`);
    }
    if (roadmap.createdAt) {
      parts.push(`Started ${this.formatMonthYear(roadmap.createdAt)}`);
    }

    return parts.length > 0
      ? parts.join(' · ')
      : 'Live roadmap data from backend';
  });

  miniPanelCareer = computed(() => {
    const roadmap = this.activeRoadmap();
    if (!roadmap) {
      return 'Roadmap';
    }
    return roadmap.careerPath?.title || roadmap.title || 'Roadmap';
  });

  completionEstimate = computed(() => {
    const roadmap = this.activeRoadmap();
    if (!roadmap?.createdAt || !roadmap.estimatedWeeks || roadmap.estimatedWeeks <= 0) {
      return 'Estimate unavailable';
    }

    const startedAt = new Date(roadmap.createdAt);
    if (Number.isNaN(startedAt.getTime())) {
      return 'Estimate unavailable';
    }

    const estimateDate = new Date(startedAt);
    estimateDate.setDate(estimateDate.getDate() + roadmap.estimatedWeeks * 7);
    return `Est. completion: ${estimateDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })}`;
  });

  progressPct = computed(() => {
    const steps = this.stepsState();
    if (!steps.length) {
      return 0;
    }
    const done = steps.filter((step) => step.status === 'done').length;
    return Math.round((done / steps.length) * 100);
  });

  filteredSteps = computed(() => {
    const filter = this.activeFilter();
    const steps = this.stepsState();

    if (filter === 'all') {
      return steps;
    }
    if (filter === 'todo') {
      return steps.filter((step) => step.status === 'pending');
    }
    if (filter === 'in-progress') {
      return steps.filter((step) => step.status === 'in-progress');
    }
    return steps.filter((step) => step.status === 'done');
  });

  ringCircum = 2 * Math.PI * 44;
  ringOffset = computed(() => this.ringCircum * (1 - this.progressPct() / 100));

  quizAnsweredCount = computed(() => {
    const session = this.quizSession();
    if (!session) {
      return 0;
    }

    return session.questions.reduce((count, question) => {
      return session.selectedAnswers[question.id] == null ? count : count + 1;
    }, 0);
  });

  quizProgressPercent = computed(() => {
    const session = this.quizSession();
    if (!session || session.questions.length === 0) {
      return 0;
    }

    return Math.round((this.quizAnsweredCount() / session.questions.length) * 100);
  });

  activeQuizQuestion = computed(() => {
    const session = this.quizSession();
    if (!session) {
      return null;
    }

    return session.questions[session.activeQuestionIndex] ?? null;
  });

  quizCanSubmit = computed(() => {
    const session = this.quizSession();
    if (!session || session.submitted || session.questions.length === 0) {
      return false;
    }

    return session.questions.every((question) => session.selectedAnswers[question.id] != null);
  });

  nextThreeSteps = computed(() =>
    this.stepsState().filter((step) => step.status !== 'done').slice(0, 3)
  );

  expandedStepData = computed(() => {
    const expanded = this.expandedStep();
    if (expanded == null) {
      return null;
    }
    return this.stepsState().find((step) => step.number === expanded) ?? null;
  });

  expandedStepBuckets = computed<ResourceBuckets>(() => {
    const empty: ResourceBuckets = { free: [], premium: [], aiTutor: [] };
    const step = this.expandedStepData();
    if (!step) {
      return empty;
    }

    return {
      free: step.resources.filter((resource) => resource.origin !== 'ai' && resource.isFree),
      premium: step.resources.filter((resource) => resource.origin !== 'ai' && !resource.isFree),
      aiTutor: step.resources.filter((resource) => resource.origin === 'ai'),
    };
  });

  expandedStepIndex = computed(() => {
    const expanded = this.expandedStep();
    if (expanded == null) {
      return -1;
    }

    return this.filteredSteps().findIndex((step) => step.number === expanded);
  });

  canOpenPreviousStep = computed(() => this.expandedStepIndex() > 0);

  canOpenNextStep = computed(() => {
    const index = this.expandedStepIndex();
    return index >= 0 && index < this.filteredSteps().length - 1;
  });

  emptyHeading = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'in-progress') return 'No steps in progress yet';
    if (filter === 'completed') return 'No completed steps yet';
    if (filter === 'todo') return 'Nothing left to do';
    return 'No steps found';
  });

  emptySubtext = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'in-progress') return 'Start your first step to see it here.';
    if (filter === 'completed') return 'Complete a step to track your progress.';
    if (filter === 'todo') return 'All steps are done or currently in progress.';
    return 'Your roadmap currently has no steps.';
  });

  ngOnInit(): void {
    this.loadRoadmap();
  }

  ngOnDestroy(): void {
    this.unlockExamMode();
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    const quiz = this.quizSession();
    if (!quiz || quiz.submitted) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  }

  toggleStep(stepNumber: number): void {
    if (this.quizSession()) {
      return;
    }

    const nextExpanded = this.expandedStep() === stepNumber ? null : stepNumber;
    this.expandedStep.set(nextExpanded);
    this.activeResourceTab.set('resources');

    if (nextExpanded == null) {
      return;
    }

    const step = this.stepsState().find((item) => item.number === nextExpanded);
    if (step) {
      this.loadStepResources(step);
    }
  }

  openPreviousStep(): void {
    this.openAdjacentStep(-1);
  }

  openNextStep(): void {
    this.openAdjacentStep(1);
  }

  private openAdjacentStep(direction: -1 | 1): void {
    if (this.quizSession()) {
      return;
    }

    const currentIndex = this.expandedStepIndex();
    if (currentIndex < 0) {
      return;
    }

    const target = this.filteredSteps()[currentIndex + direction];
    if (!target) {
      return;
    }

    this.expandedStep.set(target.number);
    this.activeResourceTab.set('resources');
    this.loadStepResources(target);
  }

  markComplete(step: Step): void {
    if (!this.hasQuizPassed(step.number)) {
      this.errorMessage.set('Pass the node quiz before marking this step complete.');
      this.startNodeQuiz(step);
      return;
    }

    if (!this.isStepCompletable(step)) {
      this.errorMessage.set(
        'Node is not available for completion yet. Complete required previous nodes first.'
      );
      return;
    }

    const userId = this.currentUserId();
    if (!step.nodeId || !userId) {
      this.errorMessage.set('Cannot complete this step without a valid roadmap node.');
      return;
    }

    const completion$ = this.completeStepRequest(step, userId);

    this.isLoading.set(true);
    this.errorMessage.set(null);

    completion$
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (graph) => {
          const visualSteps =
            graph && (graph.nodes?.length ?? 0) > 0
              ? this.mapVisualRoadmapToSteps(graph)
              : [];

          if (visualSteps.length > 0) {
            this.stepsState.set(visualSteps);
            this.syncQuizGateState(visualSteps);
            this.expandInProgressStep();
            return;
          }

          this.loadRoadmap();
        },
        error: (err: HttpErrorResponse) => {
          const backendMessage =
            (typeof err.error === 'string' ? err.error : err.error?.message) ||
            err.message;
          this.errorMessage.set(
            backendMessage
              ? `Could not sync completion with backend: ${backendMessage}`
              : 'Could not sync completion with backend. Please retry.'
          );
        },
      });
  }

  private completeStepRequest(
    step: Step,
    userId: number
  ): Observable<RoadmapVisualResponse | null> {
    if (step.completionType === 'step') {
      return this.roadmapApi
        .completeRoadmapStep(step.nodeId!, userId)
        .pipe(map(() => null as RoadmapVisualResponse | null));
    }

    return this.completeNodeWithFallback(step, userId);
  }

  private completeNodeWithFallback(
    step: Step,
    userId: number
  ): Observable<RoadmapVisualResponse | null> {
    const nodeId = step.nodeId!;

    return this.roadmapApi.completeNode(nodeId, userId).pipe(
      catchError((completeErr: HttpErrorResponse) => {
        const errorMessage = this.extractHttpErrorMessage(completeErr).toLowerCase();

        // Backend explicitly reports locked/unavailable nodes with 400.
        // In this case retries/fallbacks are invalid and only generate noisy errors.
        if (
          completeErr.status === 400 &&
          (errorMessage.includes('not available for completion') ||
            errorMessage.includes('cannot be started'))
        ) {
          return throwError(() => completeErr);
        }

        if (completeErr.status === 400 || completeErr.status === 409) {
          return this.roadmapApi.startNode(nodeId, userId).pipe(
            switchMap(() => this.roadmapApi.completeNode(nodeId, userId)),
            catchError(() =>
              this.fallbackToClassicStepCompletion(nodeId, userId, completeErr)
            )
          );
        }

        if (completeErr.status === 404) {
          return this.fallbackToClassicStepCompletion(nodeId, userId, completeErr);
        }

        return throwError(() => completeErr);
      })
    );
  }

  private fallbackToClassicStepCompletion(
    stepId: number,
    userId: number,
    originalError: HttpErrorResponse
  ): Observable<RoadmapVisualResponse | null> {
    return this.roadmapApi.completeRoadmapStep(stepId, userId).pipe(
      map(() => null as RoadmapVisualResponse | null),
      catchError(() => throwError(() => originalError))
    );
  }

  private loadRoadmap(): void {
    const userId = resolveRoadmapUserId();
    if (!userId) {
      this.errorMessage.set('No authenticated user found. Please sign in again.');
      return;
    }

    this.currentUserId.set(userId);
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.roadmapApi
      .getActiveRoadmap(userId)
      .pipe(
        switchMap((roadmap) => {
          this.activeRoadmap.set(roadmap);
          return this.roadmapApi.getRoadmapGraph(roadmap.id).pipe(
            catchError(() => of(null as RoadmapVisualResponse | null))
          );
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (graph) => {
          const visualSteps =
            graph && (graph.nodes?.length ?? 0) > 0
              ? this.mapVisualRoadmapToSteps(graph)
              : [];

          if (visualSteps.length > 0) {
            this.stepsState.set(visualSteps);
            this.expandInProgressStep();
            return;
          }

          const fallback = this.mapCrudRoadmapToSteps(this.activeRoadmap());
          this.stepsState.set(fallback);
          this.syncQuizGateState(fallback);
          this.expandInProgressStep();

          if (fallback.length === 0) {
            this.errorMessage.set('Active roadmap has no steps to display yet.');
          }
        },
        error: () => {
          this.stepsState.set([]);
          this.syncQuizGateState([]);
          this.errorMessage.set('Could not load roadmap data from backend.');
        },
      });
  }

  private loadStepResources(step: Step): void {
    const nodeId = step.nodeId;
    if (step.resourcesLoaded || step.resourcesLoading || !nodeId) {
      return;
    }

    this.patchStep(step.number, { resourcesLoading: true });

    const linkedResources$ = this.roadmapApi
      .getStepResourcesByStep(nodeId)
      .pipe(
        switchMap((existing) => {
          if (existing.length > 0) {
            return of(existing);
          }

          return this.roadmapApi.syncStepResources(nodeId).pipe(
            catchError(() => of(void 0)),
            switchMap(() => this.roadmapApi.getStepResourcesByStep(nodeId)),
            catchError(() => of([] as StepResourceDto[]))
          );
        }),
        catchError(() => of([] as StepResourceDto[]))
      );

    const aiSuggestedResources$ = this.roadmapApi
      .getStepResources(step.title)
      .pipe(catchError(() => of([] as StepResourceDto[])));

    forkJoin({
      linked: linkedResources$,
      aiSuggested: aiSuggestedResources$,
    })
      .pipe(
        finalize(() =>
          this.patchStep(step.number, {
            resourcesLoading: false,
            resourcesLoaded: true,
          })
        )
      )
      .subscribe(({ linked, aiSuggested }) => {
        this.patchStep(step.number, {
          resources: this.toResourceCards(linked, aiSuggested, step.title),
        });
      });
  }

  private patchStep(stepNumber: number, patch: Partial<Step>): void {
    this.stepsState.update((steps) =>
      steps.map((step) =>
        step.number === stepNumber
          ? {
              ...step,
              ...patch,
            }
          : step
      )
    );
  }

  private mapVisualRoadmapToSteps(response: RoadmapVisualResponse): Step[] {
    return (response.nodes ?? [])
      .slice()
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((node, index) => ({
        number: node.stepOrder || index + 1,
        title: node.title,
        description: node.objective || node.description || 'Complete this roadmap step.',
        status: this.mapStatus(node.status),
        backendStatus: this.normalizeBackendStatus(node.status),
        estimatedTime: this.toEstimatedTime(node.estimatedDays),
        resources: [],
        resourcesLoaded: false,
        resourcesLoading: false,
        nodeId: node.id,
        completionType: 'node',
      }));
  }

  private mapCrudRoadmapToSteps(roadmap: RoadmapResponse | null): Step[] {
    if (!roadmap) {
      return [];
    }

    return (roadmap.steps ?? [])
      .slice()
      .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0))
      .map((step: StepResponse, index) => ({
        number: step.stepOrder || index + 1,
        title: step.title,
        description: step.objective || 'Complete this roadmap step.',
        status: this.mapStatus(step.status),
        backendStatus: this.normalizeBackendStatus(step.status),
        estimatedTime: this.toEstimatedTime(step.estimatedDays),
        resources: [],
        resourcesLoaded: false,
        resourcesLoading: false,
        nodeId: step.id,
        completionType: 'step',
      }));
  }

  hasQuizPassed(stepNumber: number): boolean {
    return this.quizPassedState()[this.toStepKey(stepNumber)] === true;
  }

  getQuizScore(stepNumber: number): number | null {
    const score = this.quizScoresState()[this.toStepKey(stepNumber)];
    return typeof score === 'number' ? score : null;
  }

  startNodeQuiz(step: Step, force = false): void {
    if (this.quizSession() && !force) {
      return;
    }

    const questions = this.buildNodeQuiz(step).slice(0, this.quizQuestionCount);
    const selectedAnswers: Record<string, number | null> = {};
    questions.forEach((question) => {
      selectedAnswers[question.id] = null;
    });

    this.quizSession.set({
      stepNumber: step.number,
      stepTitle: step.title,
      questions,
      activeQuestionIndex: 0,
      selectedAnswers,
      passThreshold: this.quizPassThreshold,
      submitted: false,
      scorePercent: null,
      passed: false,
      feedback: null,
    });
    this.lockExamMode();
  }

  selectQuizAnswer(questionId: string, optionIndex: number): void {
    const session = this.quizSession();
    if (!session || session.submitted) {
      return;
    }

    const currentQuestion = session.questions[session.activeQuestionIndex];
    const shouldAdvance =
      currentQuestion?.id === questionId &&
      session.activeQuestionIndex < session.questions.length - 1;

    this.quizSession.set({
      ...session,
      activeQuestionIndex: shouldAdvance
        ? session.activeQuestionIndex + 1
        : session.activeQuestionIndex,
      selectedAnswers: {
        ...session.selectedAnswers,
        [questionId]: optionIndex,
      },
      feedback: null,
    });
  }

  setQuizQuestionIndex(index: number): void {
    const session = this.quizSession();
    if (!session || session.submitted) {
      return;
    }

    const nextIndex = Math.max(0, Math.min(session.questions.length - 1, index));
    this.quizSession.set({
      ...session,
      activeQuestionIndex: nextIndex,
      feedback: null,
    });
  }

  nextQuizQuestion(): void {
    const session = this.quizSession();
    if (!session || session.submitted) {
      return;
    }

    this.setQuizQuestionIndex(session.activeQuestionIndex + 1);
  }

  previousQuizQuestion(): void {
    const session = this.quizSession();
    if (!session || session.submitted) {
      return;
    }

    this.setQuizQuestionIndex(session.activeQuestionIndex - 1);
  }

  isQuizQuestionAnswered(index: number): boolean {
    const session = this.quizSession();
    if (!session) {
      return false;
    }

    const question = session.questions[index];
    if (!question) {
      return false;
    }

    return session.selectedAnswers[question.id] != null;
  }

  submitNodeQuiz(): void {
    const session = this.quizSession();
    if (!session || session.submitted) {
      return;
    }

    const hasUnanswered = session.questions.some(
      (question) => session.selectedAnswers[question.id] == null
    );

    if (hasUnanswered) {
      this.quizSession.set({
        ...session,
        feedback: 'Answer all questions before submitting this quiz.',
      });
      return;
    }

    let correctCount = 0;
    session.questions.forEach((question) => {
      if (session.selectedAnswers[question.id] === question.correctIndex) {
        correctCount += 1;
      }
    });

    const scorePercent = Math.round((correctCount / session.questions.length) * 100);
    const passed = scorePercent >= session.passThreshold;

    if (passed) {
      this.setQuizResult(session.stepNumber, scorePercent);
    } else {
      this.registerFailedQuizAttempt(session.stepNumber, session.questions);
    }

    this.quizSession.set({
      ...session,
      submitted: true,
      scorePercent,
      passed,
      feedback: passed
        ? `Passed with ${scorePercent}%. You can now mark this node complete.`
        : `Score ${scorePercent}%. Minimum required is ${session.passThreshold}%. Retake to unlock completion.`,
    });
  }

  retakeNodeQuiz(): void {
    const session = this.quizSession();
    if (!session) {
      return;
    }

    const step = this.stepsState().find((item) => item.number === session.stepNumber);
    if (!step) {
      return;
    }

    this.startNodeQuiz(step, true);
  }

  closeQuizSession(): void {
    const session = this.quizSession();
    if (!session || !session.submitted) {
      return;
    }

    this.quizSession.set(null);
    this.unlockExamMode();
  }

  quizChoiceLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  private toResourceCards(
    linkedResources: StepResourceDto[],
    aiSuggestedResources: StepResourceDto[],
    topic: string
  ): ResourceCard[] {
    const cards: ResourceCard[] = [];
    const seen = new Set<string>();

    const pushCard = (resource: StepResourceDto, origin: ResourceCard['origin']): void => {
      const url = (resource.url || '').trim();
      if (!url) {
        return;
      }

      const dedupeKey = this.resourceDedupeKey(url);
      if (seen.has(dedupeKey)) {
        return;
      }

      seen.add(dedupeKey);
      cards.push({
        type: this.normalizeResourceType(resource.type),
        title: resource.title || this.fallbackResourceTitle(origin),
        source: this.toProviderLabel(resource.provider, origin),
        url,
        isFree: this.isFreeResource(resource),
        origin,
      });
    };

    linkedResources.forEach((resource) => pushCard(resource, 'roadmap'));
    aiSuggestedResources.forEach((resource) => pushCard(resource, 'ai'));

    if (cards.length > 0) {
      return cards;
    }

    return this.buildDiscoveryFallback(topic);
  }

  private syncQuizGateState(steps: Step[]): void {
    const persisted = this.readQuizState();
    const validKeys = new Set(steps.map((step) => this.toStepKey(step.number)));

    const nextPassed: Record<string, boolean> = {};
    const nextScores: Record<string, number> = {};
    const nextSeenQuestionIds: Record<string, string[]> = {};
    const nextAttemptByStep: Record<string, number> = {};

    Object.entries(persisted.passedByStep).forEach(([key, value]) => {
      if (validKeys.has(key) && value) {
        nextPassed[key] = true;
      }
    });

    Object.entries(persisted.scoreByStep).forEach(([key, value]) => {
      if (!validKeys.has(key)) {
        return;
      }
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return;
      }
      nextScores[key] = Math.max(0, Math.min(100, Math.round(numeric)));
    });

    Object.entries(persisted.seenQuestionIdsByStep).forEach(([key, value]) => {
      if (!validKeys.has(key) || !Array.isArray(value)) {
        return;
      }

      const normalized = Array.from(
        new Set(
          value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item) => item.length > 0)
        )
      ).slice(-300);

      if (normalized.length > 0) {
        nextSeenQuestionIds[key] = normalized;
      }
    });

    Object.entries(persisted.attemptByStep).forEach(([key, value]) => {
      if (!validKeys.has(key)) {
        return;
      }

      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric < 0) {
        return;
      }

      nextAttemptByStep[key] = Math.floor(numeric);
    });

    steps.forEach((step) => {
      if (step.status === 'done') {
        const key = this.toStepKey(step.number);
        nextPassed[key] = true;
        if (nextScores[key] == null) {
          nextScores[key] = 100;
        }
      }
    });

    this.quizPassedState.set(nextPassed);
    this.quizScoresState.set(nextScores);
    this.quizSeenQuestionIdsState.set(nextSeenQuestionIds);
    this.quizAttemptCountState.set(nextAttemptByStep);
    this.persistQuizState();
  }

  private setQuizResult(stepNumber: number, scorePercent: number): void {
    const key = this.toStepKey(stepNumber);

    this.quizPassedState.update((state) => ({
      ...state,
      [key]: true,
    }));

    this.quizScoresState.update((state) => ({
      ...state,
      [key]: Math.max(0, Math.min(100, Math.round(scorePercent))),
    }));

    this.persistQuizState();
  }

  private registerFailedQuizAttempt(
    stepNumber: number,
    questions: NodeQuizQuestion[]
  ): void {
    const key = this.toStepKey(stepNumber);
    const failedQuestionIds = questions.map((question) => question.id);

    this.quizSeenQuestionIdsState.update((state) => {
      const existing = state[key] ?? [];
      const merged = Array.from(new Set([...existing, ...failedQuestionIds])).slice(-300);
      return {
        ...state,
        [key]: merged,
      };
    });

    this.quizAttemptCountState.update((state) => ({
      ...state,
      [key]: (state[key] ?? 0) + 1,
    }));

    this.persistQuizState();
  }

  private buildNodeQuiz(step: Step): NodeQuizQuestion[] {
    const stepKey = this.toStepKey(step.number);
    const seenQuestionIds = new Set(this.quizSeenQuestionIdsState()[stepKey] ?? []);
    const attemptCount = this.quizAttemptCountState()[stepKey] ?? 0;

    const topicTemplates = this.buildTopicQuestionTemplates(step);
    let availableTemplates = topicTemplates.filter((template) => !seenQuestionIds.has(template.id));

    if (availableTemplates.length < this.quizQuestionCount) {
      const dynamicTemplates = this.buildDynamicQuestionTemplates(step, seenQuestionIds);
      availableTemplates = [...availableTemplates, ...dynamicTemplates];
    }

    if (availableTemplates.length === 0) {
      availableTemplates = topicTemplates;
    }

    const selectedTemplates = this.seededShuffle(
      availableTemplates,
      step.number * 131 + attemptCount * 197 + this.quizQuestionCount
    ).slice(0, this.quizQuestionCount);

    return selectedTemplates.map((template, index) =>
      this.createQuizQuestion(
        template.id,
        template.prompt,
        template.correct,
        template.distractors,
        step.number * 37 + attemptCount * 53 + index * 11
      )
    );
  }

  private buildTopicQuestionTemplates(step: Step): NodeQuizTemplate[] {
    const topicLabel = this.resolveQuizTopicLabel(step);
    const topicKey = this.resolveQuizTopicKey(step);
    const keywords = this.extractKeywords(`${step.title} ${step.description}`);
    const keywordA = keywords[0] || topicLabel;
    const keywordB = keywords[1] || topicLabel;
    const keywordC = keywords[2] || 'implementation';
    const resourceHint =
      step.resources.find((resource) => resource.origin !== 'ai')?.title ||
      `${topicLabel} official documentation`;

    const templates: NodeQuizTemplate[] = [
      {
        id: this.composeQuizTemplateId(step.number, 'core-outcome'),
        prompt: `What best demonstrates practical mastery of ${topicLabel}?`,
        correct: `You can explain and apply ${topicLabel} to solve a real implementation task.`,
        distractors: [
          `You memorize definitions of ${topicLabel} without building anything.`,
          `You skip fundamentals and jump to unrelated advanced topics.`,
          'You only watch short summaries without hands-on practice.',
        ],
      },
      {
        id: this.composeQuizTemplateId(step.number, 'first-step'),
        prompt: `Which starting approach is strongest for learning ${topicLabel}?`,
        correct: `Understand ${keywordA} basics first, then build a small working example.`,
        distractors: [
          'Start with optimization and scaling before understanding fundamentals.',
          'Avoid official references and rely only on random snippets.',
          `Postpone practice on ${topicLabel} until every other node is done.`,
        ],
      },
      {
        id: this.composeQuizTemplateId(step.number, 'resource-usage'),
        prompt: `How should resources be used while studying ${topicLabel}?`,
        correct: `Begin with a trusted source like ${resourceHint}, then verify by practicing.`,
        distractors: [
          'Pick only the shortest resource and skip exercises.',
          'Use only social posts and ignore documentation completely.',
          'Collect many resources in parallel without finishing any.',
        ],
      },
      {
        id: this.composeQuizTemplateId(step.number, 'readiness-signal'),
        prompt: `Which signal shows you are ready to progress beyond this ${topicLabel} node?`,
        correct: `You can complete a focused task using ${keywordB} with minimal guidance.`,
        distractors: [
          `You can repeat ${topicLabel} definitions but cannot apply them.`,
          'You finish content consumption but do not test your understanding.',
          'You avoid implementation and rely on theory alone.',
        ],
      },
      {
        id: this.composeQuizTemplateId(step.number, 'debugging-path'),
        prompt: `When your ${topicLabel} solution fails, what is the best troubleshooting path?`,
        correct: `Reproduce the issue, isolate ${keywordC}, and verify fixes incrementally.`,
        distractors: [
          'Rewrite everything immediately without finding root cause.',
          'Ignore failing behavior and continue to the next node.',
          'Apply random fixes until output changes.',
        ],
      },
      {
        id: this.composeQuizTemplateId(step.number, 'practice-loop'),
        prompt: `What is the most effective practice loop for ${topicLabel}?`,
        correct: `Study a concept, implement it, review mistakes, and iterate with harder tasks.`,
        distractors: [
          'Read once and move on without implementation.',
          'Practice only easy tasks and avoid challenging scenarios.',
          'Repeat the same solved example without variation.',
        ],
      },
      {
        id: this.composeQuizTemplateId(step.number, 'quality-check'),
        prompt: `Which review habit improves long-term retention in ${topicLabel}?`,
        correct: `Regularly explain decisions, test assumptions, and refactor your solutions.`,
        distractors: [
          'Skip review as soon as code compiles once.',
          'Depend on copy-paste patterns without understanding.',
          'Wait until the final exam before revisiting concepts.',
        ],
      },
      {
        id: this.composeQuizTemplateId(step.number, 'scenario-transfer'),
        prompt: `Why is scenario variation important while learning ${topicLabel}?`,
        correct: `It validates that you can transfer ${topicLabel} skills to new contexts.`,
        distractors: [
          'It is unnecessary once a single demo works.',
          'It slows progress and should be skipped.',
          'It only matters for unrelated advanced domains.',
        ],
      },
    ];

    if (topicKey === 'java') {
      templates.push(
        {
          id: this.composeQuizTemplateId(step.number, 'java-jvm-role'),
          prompt: 'In Java, what is the primary role of the JVM?',
          correct: 'To execute Java bytecode and manage runtime services like memory and GC.',
          distractors: [
            'To replace the compiler and write Java source code automatically.',
            'To store Java files permanently instead of using a filesystem.',
            'To run only frontend JavaScript in the browser.',
          ],
        },
        {
          id: this.composeQuizTemplateId(step.number, 'java-jdk-jre'),
          prompt: 'Which statement correctly compares JDK and JRE in Java?',
          correct: 'JDK includes development tools; JRE mainly provides runtime to run Java apps.',
          distractors: [
            'JRE includes compiler tools while JDK only runs applications.',
            'They are identical packages with different names only.',
            'JDK is only for databases and JRE is only for web browsers.',
          ],
        },
        {
          id: this.composeQuizTemplateId(step.number, 'java-checked-exception'),
          prompt: 'What is true about checked exceptions in Java?',
          correct: 'They are verified at compile time and must be handled or declared.',
          distractors: [
            'They are ignored by the compiler and handled only at runtime.',
            'They can only occur in JavaScript interoperability code.',
            'They automatically terminate the JVM with no handling option.',
          ],
        },
        {
          id: this.composeQuizTemplateId(step.number, 'java-string-immutable'),
          prompt: 'Why is String immutability useful in Java?',
          correct: 'It improves safety and predictability because String values cannot be changed after creation.',
          distractors: [
            'It makes Strings mutable for faster in-place edits.',
            'It prevents Strings from being used as keys in collections.',
            'It disables garbage collection for String objects.',
          ],
        },
        {
          id: this.composeQuizTemplateId(step.number, 'java-equals-hashcode'),
          prompt: 'What is the key rule for equals and hashCode in Java objects?',
          correct: 'Equal objects must return the same hashCode value.',
          distractors: [
            'hashCode must always be unique for every object instance.',
            'equals should compare only memory addresses in all cases.',
            'hashCode is unrelated and should not be overridden with equals.',
          ],
        }
      );
    }

    return templates;
  }

  private buildDynamicQuestionTemplates(
    step: Step,
    seenQuestionIds: Set<string>
  ): NodeQuizTemplate[] {
    const topicLabel = this.resolveQuizTopicLabel(step);
    const keywords = this.extractKeywords(`${step.title} ${step.description}`);
    const anchors = keywords.length > 0 ? keywords : [topicLabel.toLowerCase()];
    const templates: NodeQuizTemplate[] = [];

    for (let index = 0; index < 160; index += 1) {
      const focus = anchors[index % anchors.length] || topicLabel;
      const id = this.composeQuizTemplateId(step.number, `dynamic-${index}`);
      if (seenQuestionIds.has(id)) {
        continue;
      }

      templates.push({
        id,
        prompt: `Scenario ${index + 1}: In ${topicLabel}, which decision best improves reliability around ${focus}?`,
        correct: `Implement ${focus} incrementally, validate with tests, and review results before scaling.`,
        distractors: [
          `Skip validating ${focus} and continue with assumptions.`,
          `Change many ${topicLabel} components at once without checkpoints.`,
          `Ignore failing outputs and move to the next roadmap topic.`,
        ],
      });

      if (templates.length >= this.quizQuestionCount * 8) {
        break;
      }
    }

    return templates;
  }

  private resolveQuizTopicLabel(step: Step): string {
    const title = step.title.trim();
    if (!title) {
      return 'this topic';
    }

    const firstSegment = title.split(/[:|\-]/)[0]?.trim();
    if (firstSegment && firstSegment.length >= 3) {
      return firstSegment;
    }

    return title;
  }

  private resolveQuizTopicKey(step: Step): string {
    const source = `${step.title} ${step.description}`.toLowerCase();

    if (/\bjava\b/.test(source)) return 'java';
    if (/\bdocker\b|\bcontainer\b/.test(source)) return 'docker';
    if (/\bkubernetes\b|\bk8s\b/.test(source)) return 'kubernetes';
    if (/\bci\s*\/\s*cd\b|\bpipeline\b/.test(source)) return 'cicd';
    if (/\btest\b|\btesting\b|\bintegration\b/.test(source)) return 'testing';
    if (/\bgit\b|\bversion control\b/.test(source)) return 'git';
    if (/\bsql\b|\bdatabase\b/.test(source)) return 'database';

    return 'generic';
  }

  private composeQuizTemplateId(stepNumber: number, key: string): string {
    return `step-${stepNumber}:${key}`;
  }

  private createQuizQuestion(
    id: string,
    prompt: string,
    correct: string,
    distractors: string[],
    seed: number
  ): NodeQuizQuestion {
    const uniqueDistractors = Array.from(
      new Set(distractors.map((item) => item.trim()).filter((item) => item.length > 0))
    ).filter((item) => item !== correct);

    const options = [correct, ...uniqueDistractors.slice(0, 3)];
    while (options.length < 4) {
      options.push('Pick the option that best matches the node objective and practical outcome.');
    }

    const shuffled = this.seededShuffle(options, seed);

    return {
      id,
      prompt,
      options: shuffled,
      correctIndex: shuffled.findIndex((option) => option === correct),
    };
  }

  private seededShuffle<T>(values: T[], seed: number): T[] {
    const result = [...values];
    let state = (seed || 1) >>> 0;

    for (let i = result.length - 1; i > 0; i -= 1) {
      state = (1664525 * state + 1013904223) >>> 0;
      const j = state % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  private extractKeywords(text: string): string[] {
    const stopwords = new Set([
      'the',
      'and',
      'for',
      'with',
      'from',
      'into',
      'this',
      'that',
      'your',
      'you',
      'are',
      'using',
      'build',
      'learn',
      'step',
      'node',
      'roadmap',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 4 && !stopwords.has(token))
      .slice(0, 8);
  }

  private readQuizState(): NodeQuizStorageState {
    const key = this.quizStorageKey();
    if (!key) {
      return {
        passedByStep: {},
        scoreByStep: {},
        seenQuestionIdsByStep: {},
        attemptByStep: {},
      };
    }

    try {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) {
        return {
          passedByStep: {},
          scoreByStep: {},
          seenQuestionIdsByStep: {},
          attemptByStep: {},
        };
      }

      const parsed = JSON.parse(raw) as Partial<NodeQuizStorageState>;
      return {
        passedByStep: parsed.passedByStep ?? {},
        scoreByStep: parsed.scoreByStep ?? {},
        seenQuestionIdsByStep: parsed.seenQuestionIdsByStep ?? {},
        attemptByStep: parsed.attemptByStep ?? {},
      };
    } catch {
      return {
        passedByStep: {},
        scoreByStep: {},
        seenQuestionIdsByStep: {},
        attemptByStep: {},
      };
    }
  }

  private persistQuizState(): void {
    const key = this.quizStorageKey();
    if (!key) {
      return;
    }

    const payload: NodeQuizStorageState = {
      passedByStep: this.quizPassedState(),
      scoreByStep: this.quizScoresState(),
      seenQuestionIdsByStep: this.quizSeenQuestionIdsState(),
      attemptByStep: this.quizAttemptCountState(),
    };

    try {
      window.sessionStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Ignore storage write failures in restricted browsing contexts.
    }
  }

  private quizStorageKey(): string | null {
    const userId = this.currentUserId();
    const roadmapId = this.activeRoadmap()?.id;
    if (!userId || !roadmapId) {
      return null;
    }
    return `smarthire-node-quiz:${userId}:${roadmapId}`;
  }

  private toStepKey(stepNumber: number): string {
    return String(stepNumber);
  }

  private lockExamMode(): void {
    if (this.previousBodyOverflow === null) {
      this.previousBodyOverflow = this.document.body.style.overflow;
    }
    this.document.body.style.overflow = 'hidden';
  }

  private unlockExamMode(): void {
    if (this.previousBodyOverflow === null) {
      return;
    }

    this.document.body.style.overflow = this.previousBodyOverflow;
    this.previousBodyOverflow = null;
  }

  private fallbackResourceTitle(origin: ResourceCard['origin']): string {
    return origin === 'ai' ? 'AI suggested resource' : 'Roadmap resource';
  }

  private toProviderLabel(
    provider: string | undefined,
    origin: ResourceCard['origin']
  ): string {
    if (provider && provider.trim()) {
      return provider;
    }
    return origin === 'ai' ? 'AI Tutor' : 'Roadmap';
  }

  private resourceDedupeKey(url: string): string {
    return url.trim().toLowerCase().replace(/^https?:\/\//, '');
  }

  private isFreeResource(resource: StepResourceDto): boolean {
    if (resource.isFree != null) {
      return resource.isFree;
    }
    if ((resource.price ?? 0) > 0) {
      return false;
    }
    return true;
  }

  private buildDiscoveryFallback(topic: string): ResourceCard[] {
    const q = encodeURIComponent(topic);
    return [
      {
        type: 'course',
        title: `Find structured courses for ${topic}`,
        source: 'Coursera Search',
        url: `https://www.coursera.org/search?query=${q}`,
        isFree: false,
        origin: 'ai',
      },
      {
        type: 'video',
        title: `${topic} full video tutorials`,
        source: 'YouTube Search',
        url: `https://www.youtube.com/results?search_query=${q}+full+course`,
        isFree: true,
        origin: 'ai',
      },
      {
        type: 'article',
        title: `${topic} docs and practical guides`,
        source: 'Documentation Search',
        url: `https://www.google.com/search?q=${q}+official+documentation+guide`,
        isFree: true,
        origin: 'ai',
      },
    ];
  }

  private normalizeResourceType(type: string | undefined): 'video' | 'article' | 'course' {
    const normalized = (type || '').toUpperCase();
    if (normalized === 'VIDEO') {
      return 'video';
    }
    if (normalized === 'COURSE') {
      return 'course';
    }
    return 'article';
  }

  isStepCompletable(step: Step): boolean {
    const status = this.normalizeBackendStatus(step.backendStatus || step.status);
    return status === 'AVAILABLE' || status === 'IN_PROGRESS';
  }

  private normalizeBackendStatus(status: string | undefined): string {
    return (status || '').toUpperCase().trim();
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

  private mapStatus(status: string | undefined): Step['status'] {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'COMPLETED' || normalized === 'DONE' || normalized === 'SKIPPED') {
      return 'done';
    }
    if (normalized === 'IN_PROGRESS') {
      return 'in-progress';
    }
    return 'pending';
  }

  private toEstimatedTime(value: number | undefined): string {
    if (!value || value <= 0) {
      return '~N/A';
    }
    return `~${value}d`;
  }

  private expandInProgressStep(): void {
    const inProgress = this.stepsState().find((step) => step.status === 'in-progress');
    this.expandedStep.set(inProgress ? inProgress.number : null);
  }

  private formatMonthYear(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'recently';
    }
    return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}
