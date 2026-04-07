import { SafeDatePipe } from './safe-date.pipe';

describe('SafeDatePipe', () => {
  it('create an instance', () => {
    const pipe = new SafeDatePipe();
    expect(pipe).toBeTruthy();
  });
});
