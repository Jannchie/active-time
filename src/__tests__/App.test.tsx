import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

describe('App', () => {
  it('Hello', () => {
    expect(render(<></>)).toBeTruthy();
  });
});
