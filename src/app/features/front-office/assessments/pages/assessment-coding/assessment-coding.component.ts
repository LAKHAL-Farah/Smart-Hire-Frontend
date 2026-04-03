import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import loader from '@monaco-editor/loader';
import type * as Monaco from 'monaco-editor';
import {
  CodingAssessmentService,
  CodingTask,
  CodingSubmission,
  formatAssessmentHttpError,
} from '../../services/coding-assessment.service';
import { ASSESSMENT_PLACEHOLDER_USER_ID } from '../../assessment-placeholder-user';

@Component({
  selector: 'app-assessment-coding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assessment-coding.component.html',
  styleUrl: './assessment-coding.component.scss',
})
export class AssessmentCodingComponent implements AfterViewInit, OnDestroy {
  /** Host for Monaco; only exists after `task` is set (see template @if). */
  @ViewChild('editorContainer') editorContainer: ElementRef<HTMLDivElement> | undefined;

  sessionId = 0;
  task = signal<CodingTask | null>(null);
  code = signal<string>('');
  loading = signal(false);
  submitting = signal(false);
  lastSubmission = signal<CodingSubmission | null>(null);
  error = signal<string | null>(null);
  /** Increments after each successful submit (for progress UI). */
  tasksCompletedLocal = signal(0);

  targetTaskCount = computed(() => {
    const s = this.codingApi.activeSession();
    return s?.targetTaskCount ?? 7;
  });

  currentTaskNumber = computed(() =>
    Math.min(this.tasksCompletedLocal() + 1, this.targetTaskCount())
  );

  private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  private monacoRef: typeof Monaco | null = null;
  private destroy$ = new Subject<void>();
  private editorMountRetries = 0;

  constructor(
    private codingApi: CodingAssessmentService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('sessionId'));
    if (!this.sessionId) {
      this.router.navigate(['/dashboard/assessment/start']);
      return;
    }

    loader.config({ paths: { vs: '/monaco/min/vs' } });
    loader
      .init()
      .then((monaco) => {
        this.monacoRef = monaco;
        this.fetchTask();
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        this.error.set(
          `Code editor failed to load (${msg}). Check that /monaco/min/vs is served (see angular.json assets).`
        );
        this.loading.set(false);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.editor?.dispose();
  }

  /** Pretty-print AI feedback JSON when possible (for template). */
  feedbackDisplayText(sub: CodingSubmission): string {
    const raw = sub.feedbackJson;
    if (!raw) {
      return '';
    }
    try {
      const o = JSON.parse(raw) as Record<string, unknown>;
      const parts: string[] = [];
      if (typeof o['quality'] === 'string') {
        parts.push(`Quality: ${o['quality']}`);
      }
      if (typeof o['score'] === 'number') {
        parts.push(`AI score: ${o['score']}`);
      }
      if (typeof o['feedback'] === 'string' && o['feedback']) {
        parts.push(String(o['feedback']));
      }
      if (Array.isArray(o['issues'])) {
        parts.push(`Issues: ${(o['issues'] as string[]).join(', ')}`);
      }
      if (parts.length > 0) {
        return parts.join('\n');
      }
    } catch {
      /* ignore */
    }
    return raw;
  }

  private fetchTask(): void {
    const monaco = this.monacoRef;
    if (!monaco) return;

    this.loading.set(true);
    this.error.set(null);
    this.codingApi
      .getTask(this.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (t) => {
          this.task.set(t);
          this.code.set(t.starterCode || '');
          this.lastSubmission.set(null);
          this.loading.set(false);
          this.cdr.detectChanges();
          // Editor host is inside @if(task); DOM is created after this tick.
          queueMicrotask(() => this.safeMountEditor(monaco, t));
        },
        error: (err: unknown) => this.handleTaskError(err),
      });
  }

  private handleTaskError(err: unknown): void {
    this.loading.set(false);
    const status = err instanceof HttpErrorResponse ? err.status : 0;
    if (status === 409) {
      this.codingApi.setActiveSession(null);
      this.router.navigate(['/dashboard/assessment/results', this.sessionId]);
      return;
    }
    this.error.set(formatAssessmentHttpError(err));
  }

  private safeMountEditor(monaco: typeof Monaco, task: CodingTask): void {
    const host = this.editorContainer?.nativeElement;
    if (!host) {
      this.editorMountRetries += 1;
      if (this.editorMountRetries > 60) {
        this.error.set('Could not attach the code editor. Try refreshing the page.');
        this.editorMountRetries = 0;
        return;
      }
      requestAnimationFrame(() => this.safeMountEditor(monaco, task));
      return;
    }
    this.editorMountRetries = 0;
    try {
      this.mountEditor(monaco, task, host);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.error.set(`Editor failed: ${msg}`);
    }
  }

  private mountEditor(
    monaco: typeof Monaco,
    task: CodingTask,
    host: HTMLElement
  ): void {
    this.editor?.dispose();
    const lang = (task.language || 'PYTHON').toLowerCase();
    const mLang = lang === 'python' ? 'python' : lang === 'java' ? 'java' : 'javascript';

    this.editor = monaco.editor.create(host, {
      value: task.starterCode || '',
      language: mLang,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
    });

    this.editor.onDidChangeModelContent(() => {
      this.code.set(this.editor?.getValue() || '');
    });
    this.editor.layout();
  }

  submit(): void {
    const t = this.task();
    if (!t) return;

    const userId = ASSESSMENT_PLACEHOLDER_USER_ID;
    const source = this.editor?.getValue() ?? this.code();

    this.submitting.set(true);
    this.error.set(null);
    this.codingApi
      .submit(t.id, userId, source)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sub) => {
          this.submitting.set(false);
          this.lastSubmission.set(sub);
          this.tasksCompletedLocal.update((n) => n + 1);
          setTimeout(() => this.fetchNextAfterSubmit(), 1500);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.error.set(formatAssessmentHttpError(err));
        },
      });
  }

  private fetchNextAfterSubmit(): void {
    const monaco = this.monacoRef;
    if (!monaco) return;

    this.codingApi
      .getTask(this.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (nextTask) => {
          this.task.set(nextTask);
          this.code.set(nextTask.starterCode || '');
          this.lastSubmission.set(null);
          this.cdr.detectChanges();
          queueMicrotask(() => this.safeMountEditor(monaco, nextTask));
        },
        error: (err: unknown) => this.handleTaskError(err),
      });
  }
}
