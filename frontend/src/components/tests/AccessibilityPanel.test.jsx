import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AccessibilityPanel from '../AccessibilityPanel';
import { UI_STRINGS } from '../../i18n/languages';

describe('AccessibilityPanel', () => {
  const baseProps = {
    strings: UI_STRINGS.en,
    highContrast: false,
    setHighContrast: vi.fn(),
    largeText: false,
    setLargeText: vi.fn(),
    voiceReplies: false,
    setVoiceReplies: vi.fn(),
  };

  test('renders all three toggles', () => {
    render(<AccessibilityPanel {...baseProps} />);
    expect(screen.getByText('High contrast')).toBeInTheDocument();
    expect(screen.getByText('Large text')).toBeInTheDocument();
    expect(screen.getByText('Voice replies')).toBeInTheDocument();
  });

  test('calls setHighContrast when toggled', () => {
    render(<AccessibilityPanel {...baseProps} />);
    const checkbox = screen.getByText('High contrast').closest('label').querySelector('input');
    fireEvent.click(checkbox);
    expect(baseProps.setHighContrast).toHaveBeenCalledWith(true);
  });

  test('reflects checked state from props', () => {
    render(<AccessibilityPanel {...baseProps} largeText={true} />);
    const checkbox = screen.getByText('Large text').closest('label').querySelector('input');
    expect(checkbox.checked).toBe(true);
  });
});
