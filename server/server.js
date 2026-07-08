import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

/**
 * Stadium Operations Assistant Server
 * Provides AI-powered guidance for venue management, accessibility, transit, and sustainability
 */

const app = express();
app.use(cors());
app.use(express.json());

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const MAX_PROMPT_LENGTH = 240;

/**
 * Sanitizes user prompt: trims, converts to lowercase, and enforces max length
 * @param {string} prompt - Raw user input
 * @returns {string} - Sanitized prompt
 */
export function sanitizePrompt(prompt) {
  const trimmed = String(prompt || '').trim().toLowerCase();
  return trimmed.slice(0, MAX_PROMPT_LENGTH);
}

/**
 * Validates and sanitizes image URL: checks length and protocol
 * @param {string} url - User-provided URL
 * @returns {string} - Valid URL or empty string
 */
export function sanitizeImageUrl(url) {
  if (!url) return '';
  const s = String(url).trim();
  if (s.length > 1024) return '';
  try {
    const u = new URL(s);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? s : '';
  } catch (e) {
    return '';
  }
}

/**
 * Pattern matching for common venue operation queries
 * Provides deterministic fallback responses based on keyword matching
 * @param {string} prompt - Sanitized user prompt
 * @returns {string} - Guidance response
 */
export function buildReply(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  const responseMap = [
    {
      keywords: ['wheelchair', 'accessible'],
      reply: 'Accessible route recommended: use the east elevators, avoid the main concourse bottleneck, and follow the priority ramp to Section 210. A staff escort can be dispatched within 3 minutes.'
    },
    {
      keywords: ['transit', 'downtown', 'public'],
      reply: 'Transit recommendation: take Metro Line 2 to Stadium North, then use the electric shuttle loop to Gate C. If crowds surge, switch to the park-and-ride at Harbor 7 and walk 8 minutes to the venue.'
    },
    {
      keywords: ['sustainability', 'emission', 'eco'],
      reply: 'Sustainability plan: dispatch electric shuttles for volunteer loops, stagger shifts by zone, and prioritize walking paths between the fan zone and the operations hub to cut emissions by roughly 18%.'
    },
    {
      keywords: ['crowd', 'route', 'gate'],
      reply: 'Crowd management advice: reroute fans from Gate B to Gate D via the north corridor, open the family lane for strollers, and keep the west plaza clear for emergency vehicles.'
    }
  ];

  for (const { keywords, reply } of responseMap) {
    if (keywords.some(kw => lowerPrompt.includes(kw))) {
      return reply;
    }
  }

  return 'AI guidance: maintain multilingual assistance in English, Spanish, and French, surface real-time queue alerts, and prioritize accessible and low-emission routes for the next 30 minutes.';
}

/**
 * Fetches assistant reply from OpenAI or falls back to heuristics
 * @param {string} prompt - User prompt
 * @param {object} options - Options object with optional imageUrl
 * @returns {Promise<string>} - Assistant reply
 */
export async function getAssistantReply(prompt, options = {}) {
  const sanitizedPrompt = sanitizePrompt(prompt);
  const imageUrl = sanitizeImageUrl(options.imageUrl || '');

  if (!sanitizedPrompt) {
    return 'Please provide a short request such as crowd rerouting, accessibility help, transport guidance, or sustainability planning.';
  }

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a stadium operations assistant for FIFA World Cup 2026. Provide short, actionable guidance for fans, volunteers, organizers, and staff, focusing on crowd rerouting, accessibility, transportation, sustainability, and multilingual support.'
          },
          {
            role: 'user',
            content: sanitizedPrompt + (imageUrl ? `\n\nImage provided: ${imageUrl}` : '')
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      const content = completion.choices?.[0]?.message?.content;
      if (content) {
        return content;
      }
    } catch (error) {
      console.warn('OpenAI fallback triggered:', error.message);
    }
  }

  // If OpenAI not configured or failed, fall back to heuristic
  const base = buildReply(sanitizedPrompt);
  return imageUrl ? `${base} (Image attached: ${imageUrl})` : base;
}

/**
 * POST /api/assistant - Main endpoint for AI guidance requests
 * Validates input, sanitizes data, and returns venue-aware recommendations
 */
app.post('/api/assistant', async (req, res) => {
  const { prompt = '', imageUrl = '' } = req.body;

  // Input validation
  if (typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt must be a string.' });
  }

  if (prompt.length > 1000) {
    return res.status(413).json({ error: 'Prompt is too long. Maximum 1000 characters.' });
  }

  try {
    const sanitizedImage = sanitizeImageUrl(imageUrl);
    const reply = await getAssistantReply(prompt, { imageUrl: sanitizedImage });
    return res.json({ reply });
  } catch (err) {
    console.error('Assistant endpoint error:', err);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

const PORT = process.env.PORT || 4000;

// Start server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Stadium ops server listening on port ${PORT}`);
  });
}

export default app;
