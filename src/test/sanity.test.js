import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('vitest infra', () => {
  it('renders DOM and asserts via jest-dom', () => {
    render(<div data-testid="hi">hello</div>);
    expect(screen.getByTestId('hi')).toHaveTextContent('hello');
  });
});
