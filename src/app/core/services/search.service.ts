import { Injectable, signal } from '@angular/core';

/**
 * Shared search service — the topbar writes the query here,
 * page components read it to filter their content.
 */
@Injectable({ providedIn: 'root' })
export class SearchService {
  readonly query = signal('');

  set(q: string): void {
    this.query.set(q);
  }

  clear(): void {
    this.query.set('');
  }
}
