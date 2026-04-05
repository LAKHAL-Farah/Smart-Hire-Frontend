import { TestBed } from '@angular/core/testing';

import { HackathonSubmissionService } from './hackathon-submission.service';

describe('HackathonSubmissionService', () => {
  let service: HackathonSubmissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HackathonSubmissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
