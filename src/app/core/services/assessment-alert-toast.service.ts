import { Injectable, signal } from '@angular/core';

export type AssessmentAlertVariant = 'info' | 'success' | 'warning';

export interface AssessmentAlertToast {
  id: string;
  title: string;
  message: string;
  variant: AssessmentAlertVariant;
}

let toastSeq = 0;

/**
 * Transient in-app alerts for skill-assessment events (auto-dismiss, no page reload).
 */
@Injectable({ providedIn: 'root' })
export class AssessmentAlertToastService {
  readonly toasts = signal<AssessmentAlertToast[]>([]);

  private readonly defaultDurationMs = 7000;
  private readonly maxToasts = 4;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  show(opts: {
    title: string;
    message: string;
    variant?: AssessmentAlertVariant;
    durationMs?: number;
  }): void {
    const id = `toast-${++toastSeq}`;
    const toast: AssessmentAlertToast = {
      id,
      title: opts.title,
      message: opts.message,
      variant: opts.variant ?? 'info',
    };

    this.toasts.update((list) => {
      const next = [...list, toast];
      if (next.length > this.maxToasts) {
        const dropped = next.shift()!;
        this.clearTimer(dropped.id);
      }
      return next;
    });

    const ms = opts.durationMs ?? this.defaultDurationMs;
    const t = setTimeout(() => this.dismiss(id), ms);
    this.timers.set(id, t);
  }

  dismiss(id: string): void {
    this.clearTimer(id);
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private clearTimer(id: string): void {
    const t = this.timers.get(id);
    if (t != null) {
      clearTimeout(t);
      this.timers.delete(id);
    }
  }
}
