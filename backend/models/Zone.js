const mongoose = require('mongoose');

/**
 * A Zone represents a physical area of the stadium (gate, concourse,
 * concession block, exit ramp, etc.) that the CV service monitors
 * for crowd density.
 */
const zoneSchema = new mongoose.Schema(
  {
    zoneId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['gate', 'concourse', 'exit', 'concession', 'restroom', 'transport_hub'],
      required: true,
    },
    capacity: { type: Number, required: true, min: 1 },
    currentCount: { type: Number, default: 0, min: 0 },
    densityLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    coordinates: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    linkedAlternateZones: [{ type: String }], // zoneIds fans can be rerouted to
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

zoneSchema.methods.computeDensityLevel = function () {
  const ratio = this.currentCount / this.capacity;
  if (ratio >= 0.9) return 'critical';
  if (ratio >= 0.7) return 'high';
  if (ratio >= 0.4) return 'medium';
  return 'low';
};

module.exports = mongoose.model('Zone', zoneSchema);
