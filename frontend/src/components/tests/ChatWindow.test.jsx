import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatWindow from '../ChatWindow';
import { UI_STRINGS } from '../../i18n/languages';
import * as api from '../../api';

describe('ChatWindow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('sends a message and displays the reply', async () => {
    vi.spyOn(api, 'sendChatMessage').mockResolvedValue({ reply: 'Gate 3 is clear right now.' });

    render(<ChatWindow sessionId="s1" language="en" strings={UI_STRINGS.en} />);

    const input = screen.getByPlaceholderText(UI_STRINGS.en.placeholder);
    fireEvent.change(input, { target: { value: 'where is gate 3' } });
    fireEvent.click(screen.getByText(UI_STRINGS.en.send));

    expect(screen.getByText('where is gate 3')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Gate 3 is clear right now.')).toBeInTheDocument();
    });
  });

  test('shows an error message when the API call fails', async () => {
    vi.spyOn(api, 'sendChatMessage').mockRejectedValue(new Error('Network error'));

    render(<ChatWindow sessionId="s1" language="en" strings={UI_STRINGS.en} />);

    const input = screen.getByPlaceholderText(UI_STRINGS.en.placeholder);
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByText(UI_STRINGS.en.send));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
  });

  test('disables send button when input is empty', () => {
    render(<ChatWindow sessionId="s1" language="en" strings={UI_STRINGS.en} />);
    expect(screen.getByText(UI_STRINGS.en.send)).toBeDisabled();
  });
});
