import { TestBed } from '@angular/core/testing';

import { AInotificationServiceService } from './ainotification-service.service';

describe('AInotificationServiceService', () => {
  let service: AInotificationServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AInotificationServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
