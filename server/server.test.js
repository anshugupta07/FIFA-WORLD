import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReply, getAssistantReply, sanitizePrompt, sanitizeImageUrl } from './server.js';

test('buildReply handles accessibility prompts', () => {
  const reply = buildReply('Help a wheelchair user reach the accessible entrance');
  assert.match(reply, /Accessible route recommended/);
});

test('getAssistantReply falls back to heuristics when no API key is configured', async () => {
  const reply = await getAssistantReply('Suggest a transit route');
  assert.match(reply, /Transit recommendation/);
});

test('sanitizePrompt trims and caps input safely', () => {
  const sanitized = sanitizePrompt('   Help a wheelchair user   ');
  assert.equal(sanitized, 'help a wheelchair user');

  const longPrompt = 'x'.repeat(5000);
  assert.equal(sanitizePrompt(longPrompt).length, 240);
});

test('sanitizeImageUrl accepts valid URLs and rejects invalid ones', () => {
  const good = sanitizeImageUrl('https://example.com/photo.jpg');
  assert.equal(good, 'https://example.com/photo.jpg');

  const bad = sanitizeImageUrl('javascript:alert(1)');
  assert.equal(bad, '');
});

test('getAssistantReply includes image note when image provided', async () => {
  const reply = await getAssistantReply('Help with crowd', { imageUrl: 'https://example.com/img.jpg' });
  assert.match(reply, /Image attached/);
});
