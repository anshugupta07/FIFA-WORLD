const { detectIntent } = require('../services/intentEngine');

describe('intentEngine.detectIntent', () => {
  test('detects gate intent', () => {
    expect(detectIntent('Where is gate 4?')).toBe('gate');
  });

  test('detects restroom intent', () => {
    expect(detectIntent('I need a washroom nearby')).toBe('restroom');
  });

  test('detects accessibility intent', () => {
    expect(detectIntent('Is there a wheelchair accessible entrance?')).toBe('accessibility');
  });

  test('detects transport intent', () => {
    expect(detectIntent('Where can I catch the metro?')).toBe('transport');
  });

  test('returns unknown for unrelated text', () => {
    expect(detectIntent('What time is kickoff?')).toBe('unknown');
  });
});
