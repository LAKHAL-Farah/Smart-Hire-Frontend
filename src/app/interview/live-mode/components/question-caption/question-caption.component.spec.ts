import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { QuestionCaptionComponent } from './question-caption.component';

describe('QuestionCaptionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionCaptionComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(QuestionCaptionComponent);
    const component = fixture.componentInstance;
    return { fixture, component };
  }

  it('is not visible on init (visible=false)', () => {
    const { fixture, component } = setup();
    fixture.detectChanges();

    expect(component.visible).toBeFalse();
    expect(fixture.nativeElement.querySelector('.caption-bar')).toBeNull();
  });

  it('becomes visible when questionText input is set', () => {
    const { fixture, component } = setup();
    component.questionText = 'Tell me about yourself.';
    fixture.detectChanges();

    expect(component.visible).toBeTrue();
    expect(fixture.nativeElement.querySelector('.caption-bar')).toBeTruthy();
  });

  it('renders question text in caption-text span', () => {
    const { fixture, component } = setup();
    component.questionText = 'Tell me about a challenge.';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.caption-text').textContent).toContain('Tell me about a challenge.');
  });

  it('auto-hides after 12 seconds', () => {
    jasmine.clock().install();
    const { fixture, component } = setup();

    component.questionText = 'Some question.';
    fixture.detectChanges();
    expect(component.visible).toBeTrue();

    jasmine.clock().tick(12000);
    expect(component.visible).toBeFalse();

    jasmine.clock().uninstall();
  });

  it('setting same text twice does NOT reset the timer (dedup check)', () => {
    jasmine.clock().install();
    const { fixture, component } = setup();

    component.questionText = 'Same question.';
    fixture.detectChanges();

    jasmine.clock().tick(6000);

    component.questionText = 'Same question.';
    fixture.detectChanges();

    jasmine.clock().tick(7000);
    expect(component.visible).toBeFalse();

    jasmine.clock().uninstall();
  });
});
