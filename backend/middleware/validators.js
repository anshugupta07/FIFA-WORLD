const { body, param, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

const chatValidators = [
  body('sessionId').isString().trim().isLength({ min: 1, max: 100 }),
  body('message').isString().trim().isLength({ min: 1, max: 500 }),
  body('language').optional().isString().isLength({ min: 2, max: 5 }),
  handleValidation,
];

const zoneUpdateValidators = [
  param('zoneId').isString().trim().isLength({ min: 1, max: 50 }),
  body('currentCount').isInt({ min: 0 }),
  handleValidation,
];

module.exports = { chatValidators, zoneUpdateValidators, handleValidation };
