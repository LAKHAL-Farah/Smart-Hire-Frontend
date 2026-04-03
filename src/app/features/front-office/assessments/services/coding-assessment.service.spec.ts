import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import {
  CodingAssessmentService,
  formatAssessmentHttpError,
} from './coding-assessment.service';
import { assessmentApiBase } from './assessment-api-base';

describe('CodingAssessmentService', () => {
  let service: CodingAssessmentService;
  let httpMock: HttpTestingController;
  const base = assessmentApiBase();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CodingAssessmentService],
    });
    service = TestBed.inject(CodingAssessmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should POST /assessment/start', () => {
    const mock = {
      id: 1,
      userId: 1,
      skill: 'BACKEND',
      level: 'INTERMEDIATE',
      theta: 0.5,
      targetTaskCount: 7,
      tasksCompleted: 0,
    };

    service
      .startSession({
        userId: 1,
        skill: 'BACKEND',
        level: 'INTERMEDIATE',
        targetTaskCount: 7,
      })
      .subscribe((s) => {
        expect(s.id).toBe(1);
        expect(s.skill).toBe('BACKEND');
      });

    const req = httpMock.expectOne(`${base}/assessment/start`);
    expect(req.request.method).toBe('POST');
    req.flush(mock);
  });

  it('should GET /assessment/task with sessionId param', () => {
    const task = {
      id: 10,
      sessionId: 1,
      title: 'Test',
      description: 'Desc',
      starterCode: 'print(1)',
      skill: 'BACKEND',
      difficulty: 'EASY',
      language: 'PYTHON',
      testCasesJson: '[]',
    };

    service.getTask(1).subscribe((t) => expect(t.title).toBe('Test'));

    const req = httpMock.expectOne(
      (r) => r.url === `${base}/assessment/task` && r.params.get('sessionId') === '1'
    );
    expect(req.request.method).toBe('GET');
    req.flush(task);
  });

  it('formatAssessmentHttpError explains connection errors', () => {
    const err = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
    expect(formatAssessmentHttpError(err)).toContain('8084');
  });
});
