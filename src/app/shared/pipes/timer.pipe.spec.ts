import { TimerPipe } from './timer.pipe';

describe('TimerPipe', () => {
  it('0 -> 00:00', () => {
    const pipe = new TimerPipe();
    expect(pipe.transform(0)).toBe('00:00');
  });

  it('59 -> 00:59', () => {
    const pipe = new TimerPipe();
    expect(pipe.transform(59)).toBe('00:59');
  });

  it('60 -> 01:00', () => {
    const pipe = new TimerPipe();
    expect(pipe.transform(60)).toBe('01:00');
  });

  it('90 -> 01:30', () => {
    const pipe = new TimerPipe();
    expect(pipe.transform(90)).toBe('01:30');
  });

  it('3600 -> 60:00', () => {
    const pipe = new TimerPipe();
    expect(pipe.transform(3600)).toBe('60:00');
  });

  it('125 -> 02:05', () => {
    const pipe = new TimerPipe();
    expect(pipe.transform(125)).toBe('02:05');
  });
});
