const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    language: { type: String, required: true },
    intent: { type: String },
    userMessage: { type: String, required: true, trim: true, maxlength: 500 },
    reply: { type: String, required: true },
    recommendedZone: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatLog', chatLogSchema);
