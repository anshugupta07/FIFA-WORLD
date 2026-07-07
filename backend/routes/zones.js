const express = require('express');
const router = express.Router();
const Zone = require('../models/Zone');
const { zoneUpdateValidators } = require('../middleware/validators');

// GET all zones (used by frontend map + heatmap)
router.get('/', async (req, res) => {
  try {
    const zones = await Zone.find().sort({ zoneId: 1 });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch zones' });
  }
});

// POST create a zone (admin/setup)
router.post('/', async (req, res) => {
  try {
    const zone = await Zone.create(req.body);
    res.status(201).json(zone);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PATCH /api/zones/:zoneId/count
 * Called by the CV service whenever it computes a new people-count
 * for a zone. Recomputes density level and broadcasts over Socket.io.
 */
router.patch('/:zoneId/count', zoneUpdateValidators, async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { currentCount } = req.body;

    const zone = await Zone.findOne({ zoneId });
    if (!zone) return res.status(404).json({ error: 'Zone not found' });

    zone.currentCount = currentCount;
    zone.densityLevel = zone.computeDensityLevel();
    zone.lastUpdated = new Date();
    await zone.save();

    const io = req.app.get('io');
    if (io) io.emit('zone_update', zone);

    res.json(zone);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update zone count' });
  }
});

module.exports = router;
