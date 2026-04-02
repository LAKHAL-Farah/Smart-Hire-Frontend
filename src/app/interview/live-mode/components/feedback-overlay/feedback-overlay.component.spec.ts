import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FeedbackOverlayComponent } from './feedback-overlay.component';

describe('FeedbackOverlayComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackOverlayComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(FeedbackOverlayComponent);
    const component = fixture.componentInstance;
    return { fixture, component };
  }

  it('renders feedbackText input', () => {
    const { fixture, component } = setup();
    component.feedbackText = 'Your answer lacked a clear result.';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.feedback-text').textContent).toContain(
      'Your answer lacked a clear result.'
    );
  });

  it('score ring stroke color is green when score >= 7', () => {
    const { component } = setup();
    component.score = 8.2;

    expect(component.scoreColor).toBe('#00e676');
  });

  it('score ring stroke color is orange when score is 5-6.9', () => {
    const { component } = setup();
    component.score = 5.5;

    expect(component.scoreColor).toBe('#ffab40');
  });

  it('score ring stroke color is red when score < 5', () => {
    const { component } = setup();
    component.score = 3.1;

    expect(component.scoreColor).toBe('#ef5350');
  });

  it('autoCountdown starts at 30 and decrements each second', () => {
    jasmine.clock().install();
    const { fixture, component } = setup();
    fixture.detectChanges();

    jasmine.clock().tick(5000);
    expect(component.autoCountdown).toBe(25);

    jasmine.clock().uninstall();
  });

  it('continueClicked emitted when autoCountdown reaches 0', () => {
    jasmine.clock().install();
    const { fixture, component } = setup();
    const continueSpy = spyOn(component.continueClicked, 'emit');
    fixture.detectChanges();

    jasmine.clock().tick(30000);
    expect(continueSpy).toHaveBeenCalled();

    jasmine.clock().uninstall();
  });

  it('onRetry emits retryClicked and clears interval', () => {
    const { fixture, component } = setup();
    fixture.detectChanges();
    const retrySpy = spyOn(component.retryClicked, 'emit');

    component.onRetry();
    expect(retrySpy).toHaveBeenCalled();
  });

  it('onContinue emits continueClicked', () => {
    const { fixture, component } = setup();
    fixture.detectChanges();
    const continueSpy = spyOn(component.continueClicked, 'emit');

    component.onContinue();
    expect(continueSpy).toHaveBeenCalled();
  });

  it('retry button click calls onRetry', () => {
    const { fixture, component } = setup();
    fixture.detectChanges();
    const retrySpy = spyOn(component, 'onRetry').and.callThrough();

    const btn = fixture.nativeElement.querySelector('.btn-retry') as HTMLButtonElement;
    btn.click();

    expect(retrySpy).toHaveBeenCalled();
  });

  it('continue button click calls onContinue', () => {
    const { fixture, component } = setup();
    fixture.detectChanges();
    const continueSpy = spyOn(component, 'onContinue').and.callThrough();

    const btn = fixture.nativeElement.querySelector('.btn-continue') as HTMLButtonElement;
    btn.click();

    expect(continueSpy).toHaveBeenCalled();
  });
});
