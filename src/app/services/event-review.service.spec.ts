import { TestBed } from '@angular/core/testing';

import { EventReviewService } from './event-review.service';

describe('EventReviewService', () => {
  let service: EventReviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventReviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
