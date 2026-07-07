import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSelector from '../LanguageSelector';

describe('LanguageSelector', () => {
  test('renders all supported languages', () => {
    render(<LanguageSelector language="en" onChange={vi.fn()} />);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('हिन्दी')).toBeInTheDocument();
    expect(screen.getByText('ગુજરાતી')).toBeInTheDocument();
  });

  test('calls onChange with new language code', () => {
    const onChange = vi.fn();
    render(<LanguageSelector language="en" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Select language'), { target: { value: 'hi' } });
    expect(onChange).toHaveBeenCalledWith('hi');
  });
});
