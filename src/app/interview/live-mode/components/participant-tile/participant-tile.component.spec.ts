import { TestBed } from '@angular/core/testing';
import { ParticipantTileComponent } from './participant-tile.component';

describe('ParticipantTileComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticipantTileComponent],
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(ParticipantTileComponent);
    const component = fixture.componentInstance;
    return { fixture, component };
  }

  it('AI tile renders avatar-face element when isAI=true', () => {
    const { fixture, component } = setup();
    component.isAI = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.avatar-face')).toBeTruthy();
  });

  it('AI tile adds speaking class to tile-wrapper when isSpeaking=true', () => {
    const { fixture, component } = setup();
    component.isAI = true;
    component.isSpeaking = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.tile-wrapper.speaking')).toBeTruthy();
  });

  it('AI tile shows sound-bars element only when isSpeaking=true', () => {
    const { fixture, component } = setup();
    component.isAI = true;
    component.isSpeaking = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sound-bars')).toBeNull();

    component.isSpeaking = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sound-bars')).toBeTruthy();
  });

  it('AI tile does NOT show sound-bars when isSpeaking=false', () => {
    const { fixture, component } = setup();
    component.isAI = true;
    component.isSpeaking = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sound-bars')).toBeNull();
  });

  it('Candidate tile renders video element when videoStream is set', () => {
    const { fixture, component } = setup();
    component.isAI = false;
    component.videoStream = new MediaStream();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('video')).toBeTruthy();
  });

  it('Candidate tile renders no-camera div when videoStream is null', () => {
    const { fixture, component } = setup();
    component.isAI = false;
    component.videoStream = null;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.no-camera')).toBeTruthy();
  });

  it('Candidate tile mic-level-fill width reflects micLevel input', () => {
    const { fixture, component } = setup();
    component.isAI = false;
    component.micLevel = 0.6;
    fixture.detectChanges();

    const fill = fixture.nativeElement.querySelector('.mic-level-fill') as HTMLElement;
    expect(fill.style.width).toBe('60%');
  });

  it('name badge renders correct name', () => {
    const { fixture, component } = setup();
    component.name = 'Alex · Acme Corp';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.name-badge').textContent).toContain('Alex · Acme Corp');
  });

  it('speaking-dot visible in name badge when isAI=true and isSpeaking=true', () => {
    const { fixture, component } = setup();
    component.isAI = true;
    component.isSpeaking = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.speaking-dot')).toBeTruthy();
  });

  it('speaking-dot NOT visible when isSpeaking=false', () => {
    const { fixture, component } = setup();
    component.isAI = true;
    component.isSpeaking = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.speaking-dot')).toBeNull();
  });
});
