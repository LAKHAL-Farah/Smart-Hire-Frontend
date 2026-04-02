import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Stomp } from '@stomp/stompjs';
import { LiveModeComponent } from './live-mode.component';
import { LiveSessionService } from '../services/live-session.service';

describe('LiveModeComponent', () => {
  let fixture: ComponentFixture<LiveModeComponent>;
  let component: LiveModeComponent;
  let mockLiveService: jasmine.SpyObj<LiveSessionService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let fakeStompClient: any;
  let subscribedCallback: ((msg: { body: string }) => void) | null;

  const audioTrack: any = { enabled: true, stop: jasmine.createSpy('audioTrackStop') };
  const videoTrack: any = { enabled: true, stop: jasmine.createSpy('videoTrackStop') };
  const fakeStream: any = {
    getAudioTracks: () => [audioTrack],
    getVideoTracks: () => [videoTrack],
    getTracks: () => [audioTrack, videoTrack],
  };

  beforeEach(async () => {
    mockLiveService = jasmine.createSpyObj<LiveSessionService>('LiveSessionService', ['abandonSession']);
    mockLiveService.abandonSession.and.returnValue(of(void 0));
    mockRouter = jasmine.createSpyObj<Router>('Router', ['navigate']);

    subscribedCallback = null;

    fakeStompClient = {
      connected: true,
      active: false,
      debug: null,
      reconnectDelay: 0,
      onConnect: null,
      activate: jasmine.createSpy('activate').and.callFake(() => {
        fakeStompClient.active = true;
        if (typeof fakeStompClient.onConnect === 'function') {
          fakeStompClient.onConnect({});
        }
      }),
      subscribe: jasmine.createSpy('subscribe').and.callFake((_topic: string, cb: (msg: { body: string }) => void) => {
        subscribedCallback = cb;
        return { unsubscribe: jasmine.createSpy('unsubscribe') };
      }),
      publish: jasmine.createSpy('publish'),
      deactivate: jasmine.createSpy('deactivate').and.callFake(() => {
        fakeStompClient.active = false;
      }),
    };

    spyOn(Stomp, 'over').and.returnValue(fakeStompClient as any);

    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {},
        configurable: true,
      });
    }

    spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve(fakeStream));

    spyOn(window, 'requestAnimationFrame').and.returnValue(1);
    spyOn(window, 'cancelAnimationFrame');

    const analyser: any = {
      fftSize: 0,
      frequencyBinCount: 8,
      getByteFrequencyData: (arr: Uint8Array) => arr.fill(20),
    };

    const audioContextMock: any = {
      createAnalyser: () => analyser,
      createMediaStreamSource: () => ({ connect: jasmine.createSpy('connect') }),
      close: jasmine.createSpy('close').and.returnValue(Promise.resolve()),
    };

    (window as any).AudioContext = jasmine.createSpy('AudioContext').and.returnValue(audioContextMock);

    class FakeMediaRecorder {
      state: 'inactive' | 'recording' = 'inactive';

      constructor(_stream: MediaStream, _options?: MediaRecorderOptions) {}

      addEventListener(_type: string, _callback: (event: BlobEvent) => void): void {}

      start(_timeslice?: number): void {
        this.state = 'recording';
      }

      stop(): void {
        this.state = 'inactive';
      }
    }

    (window as any).MediaRecorder = FakeMediaRecorder;

    spyOn(window as any, 'Audio').and.callFake(() => {
      const audio = document.createElement('audio') as HTMLAudioElement;
      spyOn(audio, 'play').and.returnValue(Promise.resolve());
      spyOn(audio, 'pause').and.callFake(() => undefined);
      return audio;
    });

    await TestBed.configureTestingModule({
      imports: [LiveModeComponent, NoopAnimationsModule],
      providers: [
        { provide: LiveSessionService, useValue: mockLiveService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ sessionId: '42' }),
              queryParamMap: convertToParamMap({ subMode: 'PRACTICE_LIVE', company: 'Acme Corp' }),
            },
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  async function createAndInitComponent() {
    fixture = TestBed.createComponent(LiveModeComponent);
    component = fixture.componentInstance;
    spyOn<any>(component, 'createSocketClient').and.returnValue({} as WebSocket);
    fixture.detectChanges();
    await Promise.resolve();
    return { fixture, component };
  }

  function triggerWsEvent(type: string, payload: any): void {
    expect(subscribedCallback).toBeTruthy();
    subscribedCallback!({ body: JSON.stringify({ type, payload }) });
  }

  it('should create the component', async () => {
    await createAndInitComponent();
    expect(component).toBeTruthy();
  });

  it('should read sessionId from route params', async () => {
    await createAndInitComponent();
    expect(component.sessionId).toBe(42);
  });

  it('should read liveSubMode from query params', async () => {
    await createAndInitComponent();
    expect(component.liveSubMode).toBe('PRACTICE_LIVE');
  });

  it('should read companyName from query params', async () => {
    await createAndInitComponent();
    expect(component.companyName).toBe('Acme Corp');
  });

  it('should request camera and mic on init', async () => {
    await createAndInitComponent();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
      jasmine.objectContaining({ video: true, audio: true })
    );
  });

  it('should connect to WebSocket on init', async () => {
    await createAndInitComponent();
    expect(fakeStompClient.activate).toHaveBeenCalled();
  });

  it('should subscribe to session topic after connect', async () => {
    await createAndInitComponent();
    expect(fakeStompClient.subscribe).toHaveBeenCalledWith('/topic/session/42', jasmine.any(Function));
  });

  it('should start session timer on init', async () => {
    jasmine.clock().install();
    await createAndInitComponent();
    jasmine.clock().tick(3000);

    expect(component.sessionTimerSeconds).toBe(3);
    jasmine.clock().uninstall();
  });

  it('LIVE_SESSION_READY sets totalQuestions and currentQuestionText', async () => {
    await createAndInitComponent();

    triggerWsEvent('LIVE_SESSION_READY', {
      sessionId: 42,
      greetingAudioUrl: '/audio/greeting.wav',
      firstQuestionId: 1,
      firstQuestionText: 'Tell me about yourself.',
      totalQuestions: 5,
      liveSubMode: 'PRACTICE_LIVE',
    });

    expect(component.totalQuestions).toBe(5);
    expect(component.currentQuestionText).toBe('Tell me about yourself.');
  });

  it('LIVE_SESSION_READY sets aiSpeaking to true', async () => {
    await createAndInitComponent();

    triggerWsEvent('LIVE_SESSION_READY', {
      sessionId: 42,
      greetingAudioUrl: '/audio/greeting.wav',
      firstQuestionId: 1,
      firstQuestionText: 'Tell me about yourself.',
      totalQuestions: 5,
      liveSubMode: 'PRACTICE_LIVE',
    });

    expect(component.aiSpeaking).toBeTrue();
  });

  it('FILLER_AUDIO does not set aiSpeaking', async () => {
    await createAndInitComponent();
    component.aiSpeaking = false;

    triggerWsEvent('FILLER_AUDIO', { audioUrl: '/audio/filler.wav' });

    expect(component.aiSpeaking).toBeFalse();
  });

  it('LIVE_AI_SPEECH updates currentQuestionText when nextQuestionText is present', async () => {
    await createAndInitComponent();

    triggerWsEvent('LIVE_AI_SPEECH', {
      audioUrl: '/audio/q2.wav',
      text: 'Okay, next question...',
      isFollowUp: false,
      isRetry: false,
      isClosing: false,
      nextQuestionId: 2,
      nextQuestionText: 'Tell me about a challenge.',
      currentQuestionIndex: 1,
      totalQuestions: 5,
    });

    expect(component.currentQuestionText).toBe('Tell me about a challenge.');
  });

  it('LIVE_AI_SPEECH updates currentQuestionIndex', async () => {
    await createAndInitComponent();

    triggerWsEvent('LIVE_AI_SPEECH', {
      audioUrl: '/audio/q3.wav',
      text: 'Next one',
      isFollowUp: false,
      isRetry: false,
      isClosing: false,
      nextQuestionId: 3,
      nextQuestionText: 'How do you handle conflict?',
      currentQuestionIndex: 2,
      totalQuestions: 5,
    });

    expect(component.currentQuestionIndex).toBe(2);
  });

  it('LIVE_AI_SPEECH with isClosing=true navigates to report on audio ended', async () => {
    await createAndInitComponent();
    spyOn<any>(component, 'playMainAudio').and.callFake((_url: string, onEnded?: () => void) => {
      onEnded?.();
    });

    triggerWsEvent('LIVE_AI_SPEECH', {
      audioUrl: '/audio/closing.wav',
      text: 'Wrapping up',
      isFollowUp: false,
      isRetry: false,
      isClosing: true,
      nextQuestionId: null,
      nextQuestionText: null,
      currentQuestionIndex: 4,
      totalQuestions: 5,
    });

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/interview/report', 42]);
  });

  it('LIVE_FEEDBACK stops listening and shows overlay after audio ends', async () => {
    await createAndInitComponent();
    spyOn<any>(component, 'playMainAudio').and.callFake((_url: string, onEnded?: () => void) => {
      onEnded?.();
    });
    const stopListeningSpy = spyOn<any>(component, 'stopListening').and.callThrough();

    triggerWsEvent('LIVE_FEEDBACK', {
      answerId: 10,
      audioUrl: '/audio/feedback.wav',
      feedbackText: 'Good start but missing the result.',
      score: 4.5,
      aiFeedback: 'Include a measurable outcome.',
      currentQuestionIndex: 0,
      totalQuestions: 5,
    });

    expect(stopListeningSpy).toHaveBeenCalled();
    expect(component.showFeedbackOverlay).toBeTrue();
    expect(component.feedbackPayload?.score).toBe(4.5);
  });

  it('REPORT_READY navigates to report as fallback', async () => {
    await createAndInitComponent();

    triggerWsEvent('REPORT_READY', { reportId: 99 });

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/interview/report', 42]);
  });

  it('onMicToggle(false) disables audio tracks and stops listening', async () => {
    await createAndInitComponent();
    (component as any).captureStream = fakeStream;

    const stopListeningSpy = spyOn<any>(component, 'stopListening').and.stub();
    component.onMicToggle(false);

    expect(fakeStream.getAudioTracks()[0].enabled).toBeFalse();
    expect(stopListeningSpy).toHaveBeenCalled();
  });

  it('onMicToggle(true) re-enables audio tracks and starts listening', async () => {
    await createAndInitComponent();
    (component as any).captureStream = fakeStream;

    const startListeningSpy = spyOn<any>(component, 'startListening').and.stub();
    component.onMicToggle(true);

    expect(startListeningSpy).toHaveBeenCalled();
  });

  it('onCameraToggle(false) disables video tracks', async () => {
    await createAndInitComponent();
    (component as any).captureStream = fakeStream;

    component.onCameraToggle(false);
    expect(fakeStream.getVideoTracks()[0].enabled).toBeFalse();
  });

  it('onLeave calls abandonSession and navigates to dashboard on confirm', async () => {
    await createAndInitComponent();

    spyOn(window, 'confirm').and.returnValue(true);
    component.onLeave();

    expect(mockLiveService.abandonSession).toHaveBeenCalledWith(42);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('onLeave does nothing if confirm returns false', async () => {
    await createAndInitComponent();

    spyOn(window, 'confirm').and.returnValue(false);
    component.onLeave();

    expect(mockLiveService.abandonSession).not.toHaveBeenCalled();
  });

  it('onRetry hides overlay and sends retry WebSocket message', async () => {
    await createAndInitComponent();

    component.showFeedbackOverlay = true;
    component.feedbackPayload = { score: 4.5 } as any;

    component.onRetry();

    expect(component.showFeedbackOverlay).toBeFalse();
    expect(component.feedbackPayload).toBeNull();
    expect(fakeStompClient.publish).toHaveBeenCalledWith({ destination: '/app/session/42/retry', body: '' });
  });

  it('onContinue hides overlay and sends continue WebSocket message', async () => {
    await createAndInitComponent();

    component.showFeedbackOverlay = true;

    component.onContinue();

    expect(component.showFeedbackOverlay).toBeFalse();
    expect(fakeStompClient.publish).toHaveBeenCalledWith({ destination: '/app/session/42/continue', body: '' });
  });

  it('ngOnDestroy stops all media tracks', async () => {
    await createAndInitComponent();

    (component as any).captureStream = fakeStream;
    component.ngOnDestroy();

    fakeStream.getTracks().forEach((track: any) => {
      expect(track.stop).toHaveBeenCalled();
    });
  });

  it('ngOnDestroy disconnects STOMP client', async () => {
    await createAndInitComponent();

    component.ngOnDestroy();
    expect(fakeStompClient.deactivate).toHaveBeenCalled();
  });
});
