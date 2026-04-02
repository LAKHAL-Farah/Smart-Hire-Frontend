import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { LiveSessionService } from './live-session.service';
import { LiveSessionStartRequest } from '../models/live-session.model';

describe('LiveSessionService', () => {
  let service: LiveSessionService;
  let httpMock: HttpTestingController;

  const reqBody: LiveSessionStartRequest = {
    userId: 1,
    careerPathId: 1,
    liveSubMode: 'PRACTICE_LIVE',
    questionCount: 5,
    companyName: 'Acme',
    targetRole: 'Engineer',
  };

  beforeEach(() => {
    localStorage.setItem('smarthire.interviewApiBaseUrl', '/api/v1');

    TestBed.configureTestingModule({
      providers: [LiveSessionService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(LiveSessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('smarthire.interviewApiBaseUrl');
  });

  it('startLiveSession sends POST to /api/v1/sessions/start-live with correct body', () => {
    service.startLiveSession(reqBody).subscribe();

    const req = httpMock.expectOne('/api/v1/sessions/start-live');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(reqBody);

    req.flush({ id: 42, liveMode: true, status: 'IN_PROGRESS' });
  });

  it('startLiveSession returns LiveSession on 200', () => {
    service.startLiveSession(reqBody).subscribe((session) => {
      expect(session.id).toBe(42);
      expect(session.liveMode).toBeTrue();
    });

    const req = httpMock.expectOne('/api/v1/sessions/start-live');
    req.flush({ id: 42, liveMode: true, status: 'IN_PROGRESS' });
  });

  it('abandonSession sends PUT to /api/v1/sessions/42/abandon', () => {
    service.abandonSession(42).subscribe();

    const req = httpMock.expectOne('/api/v1/sessions/42/abandon');
    expect(req.request.method).toBe('PUT');

    req.flush({});
  });
});
