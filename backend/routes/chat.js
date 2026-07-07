const express = require('express');
const router = express.Router();
const Zone = require('../models/Zone');
const ChatLog = require('../models/ChatLog');
const { translate } = require('../i18n/phraseBank');
const { detectIntent, INTENT_TO_ZONE_TYPE } = require('../services/intentEngine');
const { chatValidators } = require('../middleware/validators');

/**
 * POST /api/chat
 * body: { sessionId, message, language }
 * Detects intent, finds the closest relevant zone, checks live crowd
 * density, and replies in the fan's language — rerouting them if the
 * nearest zone is congested.
 */
router.post('/', chatValidators, async (req, res) => {
  try {
    const { sessionId, message, language = 'en' } = req.body;
    const intent = detectIntent(message);

    if (intent === 'unknown') {
      const reply = translate('not_understood', language);
      await ChatLog.create({ sessionId, language, intent, userMessage: message, reply });
      return res.json({ intent, reply });
    }

    if (intent === 'accessibility') {
      const zone = await Zone.findOne({ type: 'gate' }).sort({ currentCount: 1 });
      const reply = zone
        ? translate('accessible_route', language, { zone: zone.name })
        : translate('not_understood', language);
      await ChatLog.create({
        sessionId,
        language,
        intent,
        userMessage: message,
        reply,
        recommendedZone: zone?.zoneId,
      });
      return res.json({ intent, reply, zone });
    }

    const zoneType = INTENT_TO_ZONE_TYPE[intent];
    const zones = await Zone.find({ type: zoneType }).sort({ currentCount: 1 });

    if (zones.length === 0) {
      const reply = translate('not_understood', language);
      await ChatLog.create({ sessionId, language, intent, userMessage: message, reply });
      return res.json({ intent, reply });
    }

    const best = zones[0];
    const isCongested = best.densityLevel === 'high' || best.densityLevel === 'critical';

    let reply;
    let recommendedZone = best.zoneId;

    if (isCongested && zones.length > 1) {
      const alt = zones[1];
      reply = translate('zone_congested', language, { zone: best.name, alt: alt.name });
      recommendedZone = alt.zoneId;
    } else if (isCongested) {
      reply = translate('zone_congested', language, { zone: best.name, alt: 'the main concourse' });
    } else {
      reply = translate('zone_clear', language, { zone: best.name });
    }

    await ChatLog.create({ sessionId, language, intent, userMessage: message, reply, recommendedZone });

    return res.json({ intent, reply, zone: best, alternates: zones.slice(1, 3) });
  } catch (err) {
    console.error('Chat route error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/greeting/:language', (req, res) => {
  const { language } = req.params;
  return res.json({ reply: translate('greeting', language) });
});

module.exports = router;
