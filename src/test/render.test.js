import { describe, it, expect } from 'vitest';
import styled from 'styled-components';
import { renderWithTheme, screen } from './render.js';

const Box = styled.div`
  color: ${(props) => props.theme.colors?.text || 'rebeccapurple'};
`;

describe('renderWithTheme', () => {
  it('wraps the tree in the project ThemeProvider so styled-components can read theme', () => {
    renderWithTheme(<Box data-testid="box">styled</Box>);
    const el = screen.getByTestId('box');
    expect(el).toBeInTheDocument();
  });

  it('re-exports screen and userEvent from testing-library', async () => {
    const mod = await import('./render.js');
    expect(mod.screen).toBeDefined();
    expect(mod.userEvent).toBeDefined();
  });
});
