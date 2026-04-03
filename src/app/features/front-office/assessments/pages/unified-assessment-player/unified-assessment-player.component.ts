import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import loader from '@monaco-editor/loader';
import type * as Monaco from 'monaco-editor';
import {
  CombinedAssessmentResult,
  NextAssessmentItem,
  UnifiedAssessmentService,
} from '../../services/unified-assessment.service';
import { ASSESSMENT_PLACEHOLDER_USER_ID } from '../../assessment-placeholder-user';
import { formatAssessmentHttpError } from '../../services/coding-assessment.service';
import { ProfileApiService } from '../../../profile/profile-api.service';

@Component({
  selector: 'app-unified-assessment-player',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './unified-assessment-player.component.html',
  styleUrl: './unified-assessment-player.component.scss',
})
export class UnifiedAssessmentPlayerComponent implements AfterViewChecked, OnDestroy {
  private readonly api = inject(UnifiedAssessmentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly profileApi = inject(ProfileApiService);

  @ViewChild('editorHost') editorHost?: ElementRef<HTMLDivElement>;

  sessionId = 0;
  item = signal<NextAssessmentItem | null>(null);
  code = signal('');
  /** Radio selection for MCQ / language choice */
  selectedOption: number | null = null;
  textAnswer = '';
  loading = signal(true);
  submitting = signal(false);
  error = signal<string | null>(null);
  done = signal(false);
  result = signal<CombinedAssessmentResult | null>(null);
  /** Seconds left until expiresAt */
  secondsLeft = signal<number | null>(null);

  private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  private monacoReady = false;
  private editorPending = false;
  private destroy$ = new Subject<void>();
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const sid = this.route.snapshot.paramMap.get('sessionId');
    const n = sid ? Number(sid) : NaN;
    this.sessionId = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    if (!this.sessionId) {
      void this.router.navigate(['/dashboard/assessment/unified-start']);
      return;
    }
    loader.config({ paths: { vs: '/monaco/min/vs' } });
    loader
      .init()
      .then(() => {
        this.monacoReady = true;
        this.fetchNext();
      })
      .catch((e: unknown) => {
        this.error.set(e instanceof Error ? e.message : String(e));
        this.loading.set(false);
      });
  }

  ngAfterViewChecked(): void {
    const it = this.item();
    if (!this.monacoReady || !it || it.kind !== 'CODING' || !it.codingTask || this.editor) {
      return;
    }
    if (!this.editorHost?.nativeElement) {
      return;
    }
    if (this.editorPending) {
      return;
    }
    this.editorPending = true;
    queueMicrotask(() => {
      this.mountEditor(it);
      this.editorPending = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.editor?.dispose();
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private mountEditor(it: NextAssessmentItem): void {
    const task = it.codingTask;
    if (!this.editorHost?.nativeElement || !task) {
      return;
    }
    loader.init().then((monaco) => {
      if (this.editor) {
        return;
      }
      const host = this.editorHost!.nativeElement;
      const ed = monaco.editor.create(host, {
        value: task.starterCode ?? '',
        language: (task.language ?? 'python').toLowerCase() === 'python' ? 'python' : 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
      });
      this.editor = ed;
      this.code.set(ed.getValue());
      ed.onDidChangeModelContent(() => this.code.set(ed.getValue()));
      this.cdr.markForCheck();
    });
  }

  fetchNext(): void {
    this.loading.set(true);
    this.error.set(null);
    this.disposeEditorForNewItem();
    this.api
      .next(this.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (n) => {
          if (n.kind === 'LANGUAGE') {
            this.fetchNext();
            return;
          }
          this.item.set(n);
          this.selectedOption = null;
          this.textAnswer = '';
          this.loading.set(false);
          this.startTimer(n.expiresAt);
          if (n.kind === 'CODING' && n.codingTask) {
            this.code.set(n.codingTask.starterCode ?? '');
          }
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          this.loading.set(false);
          if (err instanceof HttpErrorResponse && err.status === 409) {
            this.loadResult();
            return;
          }
          if (err instanceof HttpErrorResponse && err.status === 410) {
            this.error.set('Time limit reached.');
            this.loadResult();
            return;
          }
          this.error.set(formatAssessmentHttpError(err));
        },
      });
  }

  private disposeEditorForNewItem(): void {
    this.editor?.dispose();
    this.editor = null;
  }

  private startTimer(expiresAt?: string | null): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (!expiresAt) {
      this.secondsLeft.set(null);
      return;
    }
    const end = new Date(expiresAt).getTime();
    const tick = (): void => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      this.secondsLeft.set(s);
      if (s <= 0 && this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    };
    tick();
    this.timerId = setInterval(() => tick(), 1000);
  }

  private userIdNum(): number {
    return ASSESSMENT_PLACEHOLDER_USER_ID;
  }

  submitCoding(): void {
    const it = this.item();
    if (!it?.codingTask) {
      return;
    }
    this.submitting.set(true);
    this.api
      .submitCode(this.sessionId, {
        taskId: it.codingTask.id,
        userId: this.userIdNum(),
        code: this.code(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.fetchNext();
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.error.set(formatAssessmentHttpError(err));
        },
      });
  }

  submitMcq(): void {
    const it = this.item();
    if (!it?.mcq) {
      return;
    }
    const sel = this.selectedOption;
    const qid = it.mcq.questionId;
    if (sel == null) {
      this.error.set('Select an option.');
      return;
    }
    this.postAnswer(qid, { userId: this.userIdNum(), selectedOptionIndex: sel });
  }

  submitShortOrWriting(): void {
    const it = this.item();
    const text = this.textAnswer.trim();
    const qid = it?.shortText?.questionId;
    if (qid == null) {
      return;
    }
    if (!text) {
      this.error.set('Enter an answer.');
      return;
    }
    this.postAnswer(qid, { userId: this.userIdNum(), textAnswer: text });
  }

  private postAnswer(questionId: number, body: { userId: number; selectedOptionIndex?: number; textAnswer?: string }): void {
    this.submitting.set(true);
    this.error.set(null);
    this.api
      .answer(this.sessionId, questionId, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.fetchNext();
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.error.set(formatAssessmentHttpError(err));
        },
      });
  }

  private loadResult(): void {
    this.done.set(true);
    this.item.set(null);
    this.api
      .result(this.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.result.set(r);
          this.loading.set(false);
          this.syncUnifiedResultToProfile(r);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.error.set(formatAssessmentHttpError(err));
        },
      });
  }

  goDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }

  /** Persist unified assessment scores to MS-User (or local demo storage). */
  private syncUnifiedResultToProfile(r: CombinedAssessmentResult): void {
    const payload = {
      lastAssessmentSummary: {
        kind: 'unified',
        sessionId: this.sessionId,
        at: new Date().toISOString(),
        overallScore: r.score,
        skills: r.skills,
        strengths: r.strengths,
        weaknesses: r.weaknesses,
        finalTheta: r.finalTheta,
        status: r.status,
        breakdown: r.breakdown,
      },
      [`codingSession_${this.sessionId}`]: {
        at: new Date().toISOString(),
        overallScore: r.score,
        skills: r.skills,
      },
    };
    this.profileApi.mergeAssessmentSkills(JSON.stringify(payload)).subscribe({
      error: (err) => console.warn('[SmartHire] Could not sync unified assessment to profile', err),
    });
  }
}
