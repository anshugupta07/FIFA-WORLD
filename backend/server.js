require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const chatRoutes = require('./routes/chat');
const zoneRoutes = require('./routes/zones');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
});
app.set('io', io);

// --- Security & hygiene middleware ---
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// --- Routes ---
app.use('/api/chat', chatRoutes);
app.use('/api/zones', zoneRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'fansaathi-backend' }));

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// --- DB + boot ---
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB connected');
    } else {
      console.warn('MONGO_URI not set — skipping DB connection (tests may mock it).');
    }
    server.listen(PORT, () => console.log(`FanSaathi backend running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, server, io };
