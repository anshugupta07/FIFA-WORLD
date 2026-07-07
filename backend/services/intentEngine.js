/**
 * Lightweight, dependency-free intent classifier.
 * Keeps the demo fast, explainable, and testable (no LLM round-trip
 * required for core navigation intents). An LLM/GenAI call can be
 * layered on top for open-ended queries — see llmFallback.js.
 */

// Order matters: more specific intents are checked first so a message
// like "wheelchair accessible entrance" resolves to `accessibility`
// rather than the more generic `gate` keyword match on "entrance".
const INTENT_KEYWORDS = {
  accessibility: ['wheelchair', 'accessible', 'disability', 'ramp', 'accessibility'],
  restroom: ['restroom', 'washroom', 'toilet', 'bathroom'],
  exit: ['exit', 'leave', 'way out'],
  transport: ['bus', 'metro', 'parking', 'taxi', 'transport'],
  concession: ['food', 'water', 'snack', 'concession', 'drink'],
  gate: ['gate', 'entry', 'entrance', 'door'],
};

function detectIntent(message) {
  const lower = message.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return intent;
    }
  }
  return 'unknown';
}

const INTENT_TO_ZONE_TYPE = {
  gate: 'gate',
  restroom: 'restroom',
  exit: 'exit',
  accessibility: 'gate',
  concession: 'concession',
  transport: 'transport_hub',
};

module.exports = { detectIntent, INTENT_TO_ZONE_TYPE };
