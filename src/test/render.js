import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import theme from '@/styles/theme';

export function renderWithTheme(ui, options = {}) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>, options);
}

export { screen, fireEvent, waitFor, within } from '@testing-library/react';
export { userEvent };
