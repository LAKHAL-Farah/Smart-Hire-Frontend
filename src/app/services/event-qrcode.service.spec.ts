import { TestBed } from '@angular/core/testing';

import { EventQrcodeService } from './event-qrcode.service';

describe('EventQrcodeService', () => {
  let service: EventQrcodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventQrcodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
