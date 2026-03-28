import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { InterviewApiService } from '../interview-api.service';
import { InterviewType, QuestionBookmarkDto } from '../interview.models';
import { resolveCurrentUserId } from '../interview-user.util';

@Component({
  selector: 'app-interview-bookmarks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interview-bookmarks.component.html',
  styleUrl: './interview-bookmarks.component.scss',
})
export class InterviewBookmarksComponent implements OnInit {
  private readonly api = inject(InterviewApiService);
  private readonly router = inject(Router);

  readonly userId = resolveCurrentUserId();
  readonly noteMaxLength = 600;

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly bookmarks = signal<QuestionBookmarkDto[]>([]);
  readonly tags = signal<string[]>([]);

  readonly search = signal('');
  readonly selectedTag = signal<string>('ALL');

  readonly editingBookmarkId = signal<number | null>(null);
  readonly noteDraft = signal('');
  readonly noteError = signal<string | null>(null);
  readonly noteSaving = signal(false);

  readonly deletingQuestionId = signal<number | null>(null);

  readonly filteredBookmarks = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.bookmarks().filter((bookmark) => {
      if (this.selectedTag() !== 'ALL' && (bookmark.tagLabel ?? 'NONE') !== this.selectedTag()) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        bookmark.question?.questionText ?? '',
        bookmark.tagLabel ?? '',
        bookmark.note ?? '',
        bookmark.question?.roleType ?? '',
        bookmark.question?.type ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  });

  ngOnInit(): void {
    this.loadBookmarks();
  }

  loadBookmarks(): void {
    const userId = this.userId;
    if (!userId) {
      this.loading.set(false);
      this.loadError.set('No active user found. Please sign in to view bookmarks.');
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      bookmarks: this.api.getBookmarksByUser(userId).pipe(catchError(() => of([]))),
      tags: this.api.getBookmarkTags(userId).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ bookmarks, tags }) => {
        this.bookmarks.set(bookmarks);
        this.tags.set(tags);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load bookmarks right now.');
        this.loading.set(false);
      },
    });
  }

  setTag(tag: string): void {
    this.selectedTag.set(tag);
  }

  clearFilters(): void {
    this.search.set('');
    this.selectedTag.set('ALL');
  }

  openNoteEditor(bookmark: QuestionBookmarkDto): void {
    this.editingBookmarkId.set(bookmark.id);
    this.noteDraft.set(bookmark.note ?? '');
    this.noteError.set(null);
  }

  closeNoteEditor(): void {
    this.editingBookmarkId.set(null);
    this.noteDraft.set('');
    this.noteError.set(null);
  }

  setNoteDraft(value: string): void {
    this.noteDraft.set(value.slice(0, this.noteMaxLength));
    this.noteError.set(null);
  }

  saveNote(): void {
    const bookmarkId = this.editingBookmarkId();
    if (!bookmarkId || this.noteSaving()) {
      return;
    }

    const note = this.noteDraft().trim();
    if (note.length > this.noteMaxLength) {
      this.noteError.set(`Note cannot exceed ${this.noteMaxLength} characters.`);
      return;
    }

    if (note.length > 0 && note.length < 3) {
      this.noteError.set('Note must be at least 3 characters or empty.');
      return;
    }

    this.noteSaving.set(true);
    this.api
      .updateBookmarkNote(bookmarkId, note)
      .pipe(catchError(() => of(null)))
      .subscribe((updated) => {
        this.noteSaving.set(false);
        if (!updated) {
          this.noteError.set('Unable to save note right now.');
          return;
        }

        this.bookmarks.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item))
        );
        this.closeNoteEditor();
      });
  }

  removeBookmark(bookmark: QuestionBookmarkDto): void {
    const userId = this.userId;
    if (!userId) {
      return;
    }

    if (this.deletingQuestionId() === bookmark.questionId) {
      return;
    }

    this.deletingQuestionId.set(bookmark.questionId);
    this.api
      .removeBookmark(userId, bookmark.questionId)
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        this.deletingQuestionId.set(null);
        if (result === null) {
          return;
        }

        this.bookmarks.update((items) => items.filter((item) => item.id !== bookmark.id));
        if (bookmark.tagLabel && !this.bookmarks().some((item) => item.tagLabel === bookmark.tagLabel)) {
          this.tags.update((items) => items.filter((tag) => tag !== bookmark.tagLabel));
        }
      });
  }

  practiceFromBookmark(bookmark: QuestionBookmarkDto): void {
    const role = bookmark.question?.roleType;
    const interviewType = this.toInterviewType(bookmark.question?.type);

    this.router.navigate(['/dashboard/interview/setup'], {
      queryParams: {
        ...(role ? { role } : {}),
        ...(interviewType ? { type: interviewType } : {}),
      },
    });
  }

  backToHub(): void {
    this.router.navigate(['/dashboard/interview']);
  }

  bookmarkDate(value: string | null): string {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleDateString();
  }

  private toInterviewType(questionType: string | null | undefined): InterviewType | null {
    if (questionType === 'BEHAVIORAL' || questionType === 'SITUATIONAL') {
      return 'BEHAVIORAL';
    }
    if (questionType === 'TECHNICAL' || questionType === 'CODING') {
      return 'TECHNICAL';
    }
    return null;
  }
}
