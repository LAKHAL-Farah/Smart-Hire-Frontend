import { TestBed } from '@angular/core/testing';
import { LiveTopBarComponent } from './live-top-bar.component';

describe('LiveTopBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveTopBarComponent],
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(LiveTopBarComponent);
    const component = fixture.componentInstance;
    return { fixture, component };
  }

  it('renders company name', () => {
    const { fixture, component } = setup();
    component.companyName = 'Acme Corp';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.company-name').textContent).toContain('Acme Corp');
  });

  it('timer formats seconds correctly - 90s -> 01:30', () => {
    const { fixture, component } = setup();
    component.sessionTimerSeconds = 90;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.timer').textContent.trim()).toBe('01:30');
  });

  it('timer formats 0s -> 00:00', () => {
    const { fixture, component } = setup();
    component.sessionTimerSeconds = 0;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.timer').textContent.trim()).toBe('00:00');
  });

  it('question counter shows correct Q/total', () => {
    const { fixture, component } = setup();
    component.currentQuestionIndex = 2;
    component.totalQuestions = 8;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.question-counter').textContent).toContain('Q3 / 8');
  });

  it('mode badge shows PRACTICE for PRACTICE_LIVE', () => {
    const { fixture, component } = setup();
    component.liveSubMode = 'PRACTICE_LIVE';
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.mode-badge') as HTMLElement;
    expect(badge.textContent).toContain('PRACTICE');
    expect(fixture.nativeElement.querySelector('.mode-badge.practice')).toBeTruthy();
  });

  it('mode badge shows TEST for TEST_LIVE and does not have practice class', () => {
    const { fixture, component } = setup();
    component.liveSubMode = 'TEST_LIVE';
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.mode-badge') as HTMLElement;
    expect(badge.textContent).toContain('TEST');
    expect(fixture.nativeElement.querySelector('.mode-badge.practice')).toBeNull();
  });

  it('question counter hidden when totalQuestions is 0', () => {
    const { fixture, component } = setup();
    component.totalQuestions = 0;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.question-counter')).toBeNull();
  });
});
