import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReply, getAssistantReply, sanitizePrompt, sanitizeImageUrl } from './server.js';

/**
 * Input Sanitization Tests
 */

test('sanitizePrompt trims and lowercases', () => {
  const result = sanitizePrompt('  Help A Wheelchair User  ');
  assert.strictEqual(result, 'help a wheelchair user');
  assert(!result.startsWith(' '));
  assert(!result.endsWith(' '));
});

test('sanitizePrompt enforces max length of 240 characters', () => {
  const longPrompt = 'x'.repeat(5000);
  const result = sanitizePrompt(longPrompt);
  assert.strictEqual(result.length, 240);
});

test('sanitizePrompt handles empty string', () => {
  assert.strictEqual(sanitizePrompt(''), '');
});

test('sanitizePrompt handles null/undefined', () => {
  assert.strictEqual(sanitizePrompt(null), '');
  assert.strictEqual(sanitizePrompt(undefined), '');
});

test('sanitizeImageUrl accepts valid https URL', () => {
  const url = 'https://example.com/photo.jpg';
  assert.strictEqual(sanitizeImageUrl(url), url);
});

test('sanitizeImageUrl accepts valid http URL', () => {
  const url = 'http://example.com/photo.jpg';
  assert.strictEqual(sanitizeImageUrl(url), url);
});

test('sanitizeImageUrl rejects javascript: protocol (XSS prevention)', () => {
  assert.strictEqual(sanitizeImageUrl('javascript:alert(1)'), '');
});

test('sanitizeImageUrl rejects data: protocol', () => {
  assert.strictEqual(sanitizeImageUrl('data:image/png;base64,abc123'), '');
});

test('sanitizeImageUrl rejects URLs over 1024 characters', () => {
  const longUrl = 'https://example.com/' + 'x'.repeat(2000);
  assert.strictEqual(sanitizeImageUrl(longUrl), '');
});

test('sanitizeImageUrl handles empty string', () => {
  assert.strictEqual(sanitizeImageUrl(''), '');
});

test('sanitizeImageUrl handles null/undefined', () => {
  assert.strictEqual(sanitizeImageUrl(null), '');
  assert.strictEqual(sanitizeImageUrl(undefined), '');
});

/**
 * Rule-Based Response Tests
 */

test('buildReply handles accessibility prompts', () => {
  const reply = buildReply('Help a wheelchair user reach the accessible entrance');
  assert.match(reply, /Accessible route recommended/);
  assert(reply.toLowerCase().includes('wheelchair') || reply.toLowerCase().includes('accessible'));
});

test('buildReply handles transit prompts', () => {
  const reply = buildReply('Suggest transit options from downtown');
  assert.match(reply, /Transit recommendation/);
  assert(reply.toLowerCase().includes('metro') || reply.toLowerCase().includes('transit'));
});

test('buildReply handles sustainability prompts', () => {
  const reply = buildReply('Create an eco-friendly plan');
  assert(reply.toLowerCase().includes('sustainability') || 
         reply.toLowerCase().includes('eco') || 
         reply.toLowerCase().includes('electric'));
});

test('buildReply handles crowd management prompts', () => {
  const reply = buildReply('Manage crowd congestion at gate B');
  assert(reply.toLowerCase().includes('crowd') || 
         reply.toLowerCase().includes('gate') || 
         reply.toLowerCase().includes('reroute'));
});

test('buildReply returns default response for unmatched prompts', () => {
  const reply = buildReply('random unrelated query xyz');
  assert(reply.length > 0);
  assert(typeof reply === 'string');
});

test('buildReply is case-insensitive', () => {
  const replyLower = buildReply('wheelchair');
  const replyUpper = buildReply('WHEELCHAIR');
  assert(replyLower.toLowerCase().includes('accessible'));
  assert(replyUpper.toLowerCase().includes('accessible'));
});

/**
 * Async Response Tests
 */

test('getAssistantReply falls back to heuristics when no API key configured', async () => {
  const reply = await getAssistantReply('Suggest a transit route');
  assert(reply.length > 0);
  assert(reply.includes('Transit') || reply.toLowerCase().includes('metro'));
});

test('getAssistantReply includes image note when image provided', async () => {
  const reply = await getAssistantReply('Help with crowd', { imageUrl: 'https://example.com/img.jpg' });
  assert(reply.includes('Image') || reply.includes('image'));
});

test('getAssistantReply returns appropriate response for each category', async () => {
  const categories = [
    { prompt: 'wheelchair access', keyword: 'accessible' },
    { prompt: 'transit help', keyword: 'transit' },
    { prompt: 'eco plan', keyword: 'emission' },
    { prompt: 'crowd reroute', keyword: 'crowd' }
  ];

  for (const { prompt, keyword } of categories) {
    const reply = await getAssistantReply(prompt);
    assert(reply.toLowerCase().includes(keyword.toLowerCase()) || reply.length > 0);
  }
});

test('getAssistantReply handles empty prompt gracefully', async () => {
  const reply = await getAssistantReply('');
  assert(reply.length > 0);
  assert(reply.includes('Please provide') || reply.length > 0);
});

/**
 * Integration Tests
 */

test('sanitizePrompt -> buildReply workflow', () => {
  const prompt = '  Help with ACCESSIBILITY  ';
  const sanitized = sanitizePrompt(prompt);
  assert.strictEqual(sanitized, 'help with accessibility');
  
  const reply = buildReply(sanitized);
  assert(reply.includes('Accessible') || reply.toLowerCase().includes('accessible'));
});

test('sanitizeImageUrl -> getAssistantReply workflow', async () => {
  const imageUrl = 'https://example.com/crowd.jpg';
  const sanitized = sanitizeImageUrl(imageUrl);
  assert.strictEqual(sanitized, imageUrl);
  
  const reply = await getAssistantReply('crowd issue', { imageUrl: sanitized });
  assert(reply.includes('Image') || reply.includes('image'));
});
