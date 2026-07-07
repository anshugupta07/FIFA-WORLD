const { translate } = require('../i18n/phraseBank');

describe('phraseBank.translate', () => {
  test('renders English by default', () => {
    expect(translate('greeting', 'en')).toMatch(/Welcome/);
  });

  test('renders Hindi phrase', () => {
    expect(translate('greeting', 'hi')).toMatch(/स्वागत/);
  });

  test('falls back to English for unsupported language', () => {
    expect(translate('greeting', 'zz')).toMatch(/Welcome/);
  });

  test('substitutes placeholders', () => {
    const result = translate('zone_clear', 'en', { zone: 'Gate 3' });
    expect(result).toBe('Zone Gate 3 is clear right now. Go ahead.');
  });

  test('substitutes multiple placeholders', () => {
    const result = translate('zone_congested', 'en', { zone: 'Gate 3', alt: 'Gate 5' });
    expect(result).toContain('Gate 3');
    expect(result).toContain('Gate 5');
  });
});
