import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LiveControlsComponent } from './live-controls.component';

describe('LiveControlsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveControlsComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(LiveControlsComponent);
    const component = fixture.componentInstance;
    return { fixture, component };
  }

  it('mic button shows mic icon when micEnabled=true', () => {
    const { fixture, component } = setup();
    component.micEnabled = true;
    fixture.detectChanges();

    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    expect(icons[0].textContent).toContain('mic');
  });

  it('mic button shows mic_off icon and off class when micEnabled=false', () => {
    const { fixture, component } = setup();
    component.micEnabled = false;
    fixture.detectChanges();

    const micBtn = fixture.nativeElement.querySelectorAll('.ctrl-btn')[0] as HTMLButtonElement;
    expect(micBtn.classList).toContain('off');
  });

  it('clicking mic button emits micToggled with toggled value', () => {
    const { fixture, component } = setup();
    component.micEnabled = true;
    fixture.detectChanges();

    const micSpy = spyOn(component.micToggled, 'emit');
    const micBtn = fixture.nativeElement.querySelectorAll('.ctrl-btn')[0] as HTMLButtonElement;
    micBtn.click();

    expect(micSpy).toHaveBeenCalledWith(false);
  });

  it('clicking camera button emits cameraToggled', () => {
    const { fixture, component } = setup();
    fixture.detectChanges();

    const cameraSpy = spyOn(component.cameraToggled, 'emit');
    const cameraBtn = fixture.nativeElement.querySelectorAll('.ctrl-btn')[1] as HTMLButtonElement;
    cameraBtn.click();

    expect(cameraSpy).toHaveBeenCalled();
  });

  it('leave button has danger class', () => {
    const { fixture } = setup();
    fixture.detectChanges();

    const leaveBtn = fixture.nativeElement.querySelector('.ctrl-btn.leave');
    expect(leaveBtn).toBeTruthy();
  });

  it('clicking leave emits leaveClicked', () => {
    const { fixture, component } = setup();
    fixture.detectChanges();

    const leaveSpy = spyOn(component.leaveClicked, 'emit');
    const leaveBtn = fixture.nativeElement.querySelector('.ctrl-btn.leave') as HTMLButtonElement;
    leaveBtn.click();

    expect(leaveSpy).toHaveBeenCalled();
  });
});
