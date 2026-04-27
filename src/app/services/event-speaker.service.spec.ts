import { TestBed } from '@angular/core/testing';

import { EventSpeakerService } from './event-speaker.service';

describe('EventSpeakerService', () => {
  let service: EventSpeakerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventSpeakerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
