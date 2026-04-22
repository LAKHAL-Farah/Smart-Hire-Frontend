import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, HostBinding, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  animate,
  query,
  stagger,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import { LUCIDE_ICONS } from '../../../../shared/lucide-icons';
import {
  CandidateCvDto,
  CreateJobOfferRequest,
  CvVersionDto,
  JobOfferDto,
} from '../../../../core/models/profile-optimizer.models';
import {
  PROFILE_OPTIMIZER_USER_ID,
  ProfileOptimizerService,
} from '../../../../core/services/profile-optimizer.service';

type ToastType = 'success' | 'error';

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type LoadingState = {
  page: boolean;
  upload: boolean;
  tailor: boolean;
  score: boolean;
  jobOffer: boolean;
  export: string | null;
};

type ErrorState = {
  upload: string | null;
  tailor: string | null;
  jobOffer: string | null;
  page: string | null;
};

type CvViewState = 'EMPTY' | 'PARSING' | 'LOADED';

@Component({
  selector: 'app-profile-optimizer',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, LUCIDE_ICONS],
  templateUrl: './profile-optimizer.component.html',
  styleUrl: './profile-optimizer.component.scss',
  animations: [
    trigger('cvPanelTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(8px)' })),
      ]),
    ]),
    trigger('expandBlock', [
      state('closed', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      state('open', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      transition('closed <=> open', animate('200ms ease')),
    ]),
    trigger('versionExpand', [
      state('closed', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      state('open', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      transition('closed <=> open', animate('250ms ease')),
    ]),
    trigger('toastSlide', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('250ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 })),
      ]),
    ]),
    trigger('statusBarStagger', [
      transition(':enter', [
        query(
          '.status-chip',
          [
            style({ opacity: 0, transform: 'translateY(-8px)' }),
            stagger(150, animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class ProfileOptimizerComponent implements OnInit {
  // NOTE: This codebase uses shared `LUCIDE_ICONS` for standalone components.
  // Explicit per-icon imports are not used here to stay consistent with existing patterns.
  private readonly optimizerApi = inject(ProfileOptimizerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeCv = signal<CandidateCvDto | null>(null);
  readonly cvVersions = signal<CvVersionDto[]>([]);
  readonly jobOffers = signal<JobOfferDto[]>([]);
  readonly selectedJobOfferId = signal<string | null>(null);
  readonly expandedVersionId = signal<string | null>(null);

  readonly loading = signal<LoadingState>({
    page: true,
    upload: false,
    tailor: false,
    score: false,
    jobOffer: false,
    export: null,
  });

  readonly errors = signal<ErrorState>({
    upload: null,
    tailor: null,
    jobOffer: null,
    page: null,
  });

  readonly toasts = signal<Toast[]>([]);

  readonly addJobOfferOpen = signal<boolean>(false);
  readonly tailorStatus = signal<string>('');

  readonly canTailor = computed(() => this.activeCv() !== null && this.selectedJobOfferId() !== null);

  readonly originalVersion = computed(
    () => this.cvVersions().find((v) => v.versionType === 'ORIGINAL') ?? null
  );

  readonly tailoredVersions = computed(() =>
    this.cvVersions().filter((v) => v.versionType !== 'ORIGINAL')
  );

  readonly selectedJobOffer = computed(
    () => this.jobOffers().find((j) => j.id === this.selectedJobOfferId()) ?? null
  );

  readonly statusScore = computed(() => this.activeCv()?.atsScore ?? 0);

  readonly cvState = computed<CvViewState>(() => {
    const cv = this.activeCv();
    if (!cv) {
      return 'EMPTY';
    }
    if (cv.parseStatus === 'PENDING' || cv.parseStatus === 'IN_PROGRESS' || this.loading().upload) {
      return 'PARSING';
    }
    return 'LOADED';
  });

  readonly scoreRingColor = computed(() => {
    const score = this.statusScore();
    if (score >= 80) {
      return 'var(--accent-teal)';
    }
    if (score >= 60) {
      return 'var(--accent-blue)';
    }
    return 'var(--accent-pink)';
  });

  readonly scorePercent = computed(() => {
    const raw = this.statusScore();
    const bounded = Math.min(100, Math.max(0, Number(raw) || 0));
    return bounded;
  });

  @HostBinding('style.--po-score-angle')
  get scoreAngleVar(): string {
    return `${this.scorePercent() * 3.6}deg`;
  }

  selectedFile: File | null = null;
  dragOver = false;

  jobTitle = '';
  jobCompany = '';
  jobDescription = '';
  jobSourceUrl = '';

  confirmingDeleteJobOfferId: string | null = null;
  downloadedVersionId = signal<string | null>(null);

  private toastCounter = 0;
  private tailorStatusIntervalId: number | null = null;

  ngOnInit(): void {
    this.loadInitial();
  }

  loadInitial(): void {
    this.patchLoading({ page: true });
    this.patchErrors({ page: null });

    const activeCv$ = this.optimizerApi.listCvs().pipe(
      map((rows) => this.pickUserActiveCv(rows)),
      catchError((err: Error) => {
        this.patchErrors({ page: err.message });
        return of(null);
      })
    );

    const offers$ = this.optimizerApi.listJobOffers().pipe(
      map((rows) => rows.filter((o) => o.userId === PROFILE_OPTIMIZER_USER_ID)),
      catchError((err: Error) => {
        this.patchErrors({ page: this.errors().page ? this.errors().page : err.message });
        return of([] as JobOfferDto[]);
      })
    );

    forkJoin({ cv: activeCv$, offers: offers$ })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ cv, offers }) => {
        this.activeCv.set(cv);
        this.jobOffers.set(offers);
        this.addJobOfferOpen.set(offers.length === 0);
        this.selectedJobOfferId.set(offers[0]?.id ?? null);

        if (!cv) {
          this.patchLoading({ page: false });
          return;
        }

        forkJoin({
          versions: this.optimizerApi.getCvVersions(cv.id).pipe(catchError(() => of([] as CvVersionDto[]))),
          score: this.optimizerApi.getCvScore(cv.id).pipe(catchError(() => of(null))),
        })
          .pipe(
            finalize(() => this.patchLoading({ page: false })),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(({ versions, score }) => {
            this.cvVersions.set(versions);
            if (score?.atsScore != null) {
              this.activeCv.update((cur) => (cur ? { ...cur, atsScore: score.atsScore } : cur));
            }
          });
      });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.item(0) ?? null;
    if (file) {
      this.selectedFile = file;
      this.patchErrors({ upload: null });
    }
  }

  onFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.item(0) ?? null;
    this.patchErrors({ upload: null });
    input.value = '';
  }

  uploadAndParse(): void {
    if (!this.selectedFile) {
      this.patchErrors({ upload: 'Please choose a CV file before uploading.' });
      return;
    }

    this.patchErrors({ upload: null });
    this.patchLoading({ upload: true });

    this.optimizerApi
      .uploadCv(this.selectedFile, PROFILE_OPTIMIZER_USER_ID)
      .pipe(
        finalize(() => this.patchLoading({ upload: false })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (cv) => {
          this.activeCv.set(cv);
          this.selectedFile = null;
          this.refreshScoreAndVersions(cv.id);
          this.pushToast('success', 'CV uploaded and parsed successfully.');
        },
        error: (err: Error) => {
          this.patchErrors({ upload: err.message });
          this.pushToast('error', err.message);
        },
      });
  }

  replaceCv(): void {
    this.activeCv.set(null);
    this.cvVersions.set([]);
    this.selectedFile = null;
    this.patchErrors({ upload: null });
  }

  saveJobOffer(): void {
    if (!this.jobTitle.trim() || !this.jobDescription.trim()) {
      this.patchErrors({ jobOffer: 'Job title and description are required.' });
      return;
    }

    const body: CreateJobOfferRequest = {
      title: this.jobTitle.trim(),
      company: this.jobCompany.trim() || undefined,
      rawDescription: this.jobDescription.trim(),
      sourceUrl: this.jobSourceUrl.trim() || undefined,
    };

    this.patchErrors({ jobOffer: null });
    this.patchLoading({ jobOffer: true });

    this.optimizerApi
      .createJobOffer(body, PROFILE_OPTIMIZER_USER_ID)
      .pipe(
        finalize(() => this.patchLoading({ jobOffer: false })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (created) => {
          this.jobOffers.update((rows) => [created, ...rows]);
          this.selectedJobOfferId.set(created.id);
          this.addJobOfferOpen.set(false);
          this.resetJobOfferForm();
          this.pushToast('success', 'Job offer saved. Keywords extracted.');
        },
        error: (err: Error) => {
          this.patchErrors({ jobOffer: err.message });
          this.pushToast('error', err.message);
        },
      });
  }

  promptDeleteJobOffer(id: string): void {
    this.confirmingDeleteJobOfferId = id;
  }

  cancelDeleteJobOffer(): void {
    this.confirmingDeleteJobOfferId = null;
  }

  confirmDeleteJobOffer(id: string): void {
    this.optimizerApi
      .deleteJobOffer(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.jobOffers.update((rows) => rows.filter((row) => row.id !== id));
          if (this.selectedJobOfferId() === id) {
            this.selectedJobOfferId.set(this.jobOffers()[0]?.id ?? null);
          }
          this.confirmingDeleteJobOfferId = null;
          this.pushToast('success', 'Job offer deleted.');
        },
        error: (err: Error) => {
          this.pushToast('error', err.message);
        },
      });
  }

  runTailor(): void {
    const cv = this.activeCv();
    const jobOfferId = this.selectedJobOfferId();
    if (!cv || !jobOfferId) {
      return;
    }

    this.patchErrors({ tailor: null });
    this.patchLoading({ tailor: true });
    this.startTailorStatusCycle();

    this.optimizerApi
      .tailorCv(cv.id, jobOfferId)
      .pipe(
        finalize(() => {
          this.patchLoading({ tailor: false });
          this.stopTailorStatusCycle();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (newVersion) => {
          this.cvVersions.update((rows) => [newVersion, ...rows]);
          this.refreshScore(cv.id);
          this.pushToast('success', 'Tailored version created.');
        },
        error: (err: Error) => {
          this.patchErrors({ tailor: err.message });
          this.pushToast('error', err.message);
        },
      });
  }

  toggleExpandedVersion(id: string): void {
    this.expandedVersionId.set(this.expandedVersionId() === id ? null : id);
  }

  downloadVersion(version: CvVersionDto): void {
    this.patchLoading({ export: version.id });
    this.optimizerApi
      .exportCvVersionPdf(version.id)
      .pipe(
        finalize(() => this.patchLoading({ export: null })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = objectUrl;
          anchor.download = `cv-version-${version.id}.pdf`;
          anchor.click();
          URL.revokeObjectURL(objectUrl);

          this.downloadedVersionId.set(version.id);
          window.setTimeout(() => this.downloadedVersionId.set(null), 900);
        },
        error: (err: Error) => {
          this.pushToast('error', err.message);
        },
      });
  }

  scoreTone(score: number | null): 'high' | 'mid' | 'low' {
    const s = score ?? 0;
    if (s >= 80) {
      return 'high';
    }
    if (s >= 60) {
      return 'mid';
    }
    return 'low';
  }

  fileSizeLabel(file: File | null): string {
    if (!file) {
      return '';
    }
    const kb = file.size / 1024;
    if (kb < 1024) {
      return `${Math.round(kb)} KB`;
    }
    return `${(kb / 1024).toFixed(2)} MB`;
  }

  parsedKeywords(cv: CandidateCvDto | null): string[] {
    if (!cv?.parsedContent) {
      return [];
    }
    try {
      const parsed = JSON.parse(cv.parsedContent) as {
        keywords?: unknown;
        skills?: unknown;
      };
      const source = Array.isArray(parsed.keywords)
        ? parsed.keywords
        : Array.isArray(parsed.skills)
          ? parsed.skills
          : [];
      return source.map((x) => String(x)).filter((x) => x.trim().length > 0);
    } catch {
      return [];
    }
  }

  offerKeywords(offer: JobOfferDto): string[] {
    if (!offer.extractedKeywords) {
      return [];
    }
    try {
      const parsed = JSON.parse(offer.extractedKeywords) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x));
      }
      return [];
    } catch {
      return [];
    }
  }

  versionJobOfferTitle(version: CvVersionDto): string {
    if (!version.jobOfferId) {
      return 'General optimization';
    }
    const offer = this.jobOffers().find((j) => j.id === version.jobOfferId);
    return offer?.title ?? 'Unknown job offer';
  }

  private refreshScoreAndVersions(cvId: string): void {
    this.patchLoading({ score: true });
    forkJoin({
      versions: this.optimizerApi.getCvVersions(cvId).pipe(catchError(() => of([] as CvVersionDto[]))),
      score: this.optimizerApi.getCvScore(cvId).pipe(catchError(() => of(null))),
    })
      .pipe(
        finalize(() => this.patchLoading({ score: false })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ versions, score }) => {
        this.cvVersions.set(versions);
        if (score?.atsScore != null) {
          this.activeCv.update((cur) => (cur ? { ...cur, atsScore: score.atsScore } : cur));
        }
      });
  }

  private refreshScore(cvId: string): void {
    this.patchLoading({ score: true });
    this.optimizerApi
      .getCvScore(cvId)
      .pipe(
        finalize(() => this.patchLoading({ score: false })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (score) => {
          this.activeCv.update((cur) => (cur ? { ...cur, atsScore: score.atsScore } : cur));
        },
      });
  }

  private pickUserActiveCv(cvs: CandidateCvDto[]): CandidateCvDto | null {
    const mine = cvs.filter((cv) => cv.userId === PROFILE_OPTIMIZER_USER_ID);
    if (mine.length === 0) {
      return null;
    }
    return mine.find((cv) => cv.isActive) ?? mine[0] ?? null;
  }

  private startTailorStatusCycle(): void {
    this.stopTailorStatusCycle();
    const steps = [
      'Analyzing job requirements...',
      'Matching your experience...',
      'Rewriting key sections...',
      'Finalizing your CV...',
    ];
    let index = 0;
    this.tailorStatus.set(steps[0]);

    this.tailorStatusIntervalId = window.setInterval(() => {
      index = Math.min(index + 1, steps.length - 1);
      this.tailorStatus.set(steps[index]);
    }, 3000);
  }

  private stopTailorStatusCycle(): void {
    if (this.tailorStatusIntervalId != null) {
      window.clearInterval(this.tailorStatusIntervalId);
      this.tailorStatusIntervalId = null;
    }
    this.tailorStatus.set('');
  }

  private resetJobOfferForm(): void {
    this.jobTitle = '';
    this.jobCompany = '';
    this.jobDescription = '';
    this.jobSourceUrl = '';
  }

  private pushToast(type: ToastType, message: string): void {
    const id = ++this.toastCounter;
    const toast: Toast = { id, type, message };
    this.toasts.update((rows) => [...rows, toast]);
    window.setTimeout(() => {
      this.toasts.update((rows) => rows.filter((t) => t.id !== id));
    }, 3000);
  }

  private patchLoading(patch: Partial<LoadingState>): void {
    this.loading.update((cur) => ({ ...cur, ...patch }));
  }

  private patchErrors(patch: Partial<ErrorState>): void {
    this.errors.update((cur) => ({ ...cur, ...patch }));
  }
}
