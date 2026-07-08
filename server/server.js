import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const MAX_PROMPT_LENGTH = 240;

export function sanitizePrompt(prompt) {
  const trimmed = String(prompt || '').trim().toLowerCase();
  return trimmed.slice(0, MAX_PROMPT_LENGTH);
}

export function sanitizeImageUrl(url) {
  if (!url) return '';
  const s = String(url).trim();
  if (s.length > 1024) return '';
  // Basic URL check (allow http/https)
  try {
    const u = new URL(s);
    if (u.protocol === 'http:' || u.protocol === 'https:') return s;
  } catch (e) {
    return '';
  }
  return '';
}

export function buildReply(prompt) {
  const lowerPrompt = sanitizePrompt(prompt);

  if (lowerPrompt.includes('wheelchair') || lowerPrompt.includes('accessible')) {
    return 'Accessible route recommended: use the east elevators, avoid the main concourse bottleneck, and follow the priority ramp to Section 210. A staff escort can be dispatched within 3 minutes.';
  }

  if (lowerPrompt.includes('transit') || lowerPrompt.includes('downtown') || lowerPrompt.includes('public')) {
    return 'Transit recommendation: take Metro Line 2 to Stadium North, then use the electric shuttle loop to Gate C. If crowds surge, switch to the park-and-ride at Harbor 7 and walk 8 minutes to the venue.';
  }

  if (lowerPrompt.includes('sustainability') || lowerPrompt.includes('emission') || lowerPrompt.includes('eco')) {
    return 'Sustainability plan: dispatch electric shuttles for volunteer loops, stagger shifts by zone, and prioritize walking paths between the fan zone and the operations hub to cut emissions by roughly 18%.';
  }

  if (lowerPrompt.includes('crowd') || lowerPrompt.includes('route') || lowerPrompt.includes('gate')) {
    return 'Crowd management advice: reroute fans from Gate B to Gate D via the north corridor, open the family lane for strollers, and keep the west plaza clear for emergency vehicles.';
  }

  return 'AI guidance: maintain multilingual assistance in English, Spanish, and French, surface real-time queue alerts, and prioritize accessible and low-emission routes for the next 30 minutes.';
}

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
        temperature: 0.7
      });
      const content = completion.choices?.[0]?.message?.content;
      if (content) {
        return content;
      }
    } catch (error) {
      console.warn('OpenAI fallback triggered:', error.message);
    }
  }

  // If OpenAI not configured or failed, fall back to heuristic and include image notice
  const base = buildReply(sanitizedPrompt);
  return imageUrl ? `${base} (Image attached: ${imageUrl})` : base;
}

app.post('/api/assistant', async (req, res) => {
  const { prompt = '', imageUrl = '' } = req.body;

  if (typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt must be a string.' });
  }

  if (prompt.length > 1000) {
    return res.status(413).json({ error: 'Prompt is too long.' });
  }

  const sanitizedImage = sanitizeImageUrl(imageUrl);
  const reply = await getAssistantReply(prompt, { imageUrl: sanitizedImage });
  return res.json({ reply });
});

const PORT = process.env.PORT || 4000;
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`Stadium ops server listening on port ${PORT}`);
  });
}

export default app;
