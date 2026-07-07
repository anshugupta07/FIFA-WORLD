// Mock Mongoose models so tests run without a live MongoDB instance —
// keeps the suite fast and dependency-free for CI / judging environments.
jest.mock('../models/Zone');
jest.mock('../models/ChatLog');

const request = require('supertest');
const { app } = require('../server');
const Zone = require('../models/Zone');
const ChatLog = require('../models/ChatLog');

function makeZone(overrides = {}) {
  const base = {
    zoneId: 'gate-1',
    name: 'Gate 1',
    type: 'gate',
    capacity: 100,
    currentCount: 0,
    densityLevel: 'low',
    coordinates: { x: 0, y: 0 },
    computeDensityLevel() {
      const ratio = this.currentCount / this.capacity;
      if (ratio >= 0.9) return 'critical';
      if (ratio >= 0.7) return 'high';
      if (ratio >= 0.4) return 'medium';
      return 'low';
    },
    save: jest.fn().mockResolvedValue(true),
  };
  return { ...base, ...overrides };
}

beforeEach(() => {
  jest.clearAllMocks();
  ChatLog.create.mockResolvedValue({});
});

describe('Zones API', () => {
  test('creates a zone', async () => {
    const created = makeZone();
    Zone.create.mockResolvedValue(created);

    const res = await request(app).post('/api/zones').send({
      zoneId: 'gate-1',
      name: 'Gate 1',
      type: 'gate',
      capacity: 100,
      coordinates: { x: 10, y: 20 },
    }).expect(201);

    expect(res.body.zoneId).toBe('gate-1');
  });

  test('fetches all zones', async () => {
    const sortMock = jest.fn().mockResolvedValue([makeZone()]);
    Zone.find.mockReturnValue({ sort: sortMock });

    const res = await request(app).get('/api/zones').expect(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].zoneId).toBe('gate-1');
  });

  test('rejects invalid (negative) count update', async () => {
    await request(app)
      .patch('/api/zones/gate-2/count')
      .send({ currentCount: -5 })
      .expect(400);
  });

  test('returns 404 for unknown zone on count update', async () => {
    Zone.findOne.mockResolvedValue(null);

    await request(app)
      .patch('/api/zones/does-not-exist/count')
      .send({ currentCount: 5 })
      .expect(404);
  });

  test('updates count and recomputes density to critical', async () => {
    const zone = makeZone({ currentCount: 0 });
    Zone.findOne.mockResolvedValue(zone);

    const res = await request(app)
      .patch('/api/zones/gate-1/count')
      .send({ currentCount: 95 })
      .expect(200);

    expect(res.body.densityLevel).toBe('critical');
    expect(zone.save).toHaveBeenCalled();
  });
});

describe('Chat API', () => {
  test('greeting endpoint returns localized text', async () => {
    const res = await request(app).get('/api/chat/greeting/hi').expect(200);
    expect(res.body.reply).toMatch(/स्वागत/);
  });

  test('routes fan to least-congested gate', async () => {
    const gateA = makeZone({ zoneId: 'gate-a', name: 'Gate A', currentCount: 95, densityLevel: 'critical' });
    const gateB = makeZone({ zoneId: 'gate-b', name: 'Gate B', currentCount: 10, densityLevel: 'low' });
    const sortMock = jest.fn().mockResolvedValue([gateA, gateB]);
    Zone.find.mockReturnValue({ sort: sortMock });

    const res = await request(app).post('/api/chat').send({
      sessionId: 'sess-1',
      message: 'where is the nearest gate',
      language: 'en',
    }).expect(200);

    expect(res.body.intent).toBe('gate');
    expect(res.body.reply).toMatch(/Gate A/);
    expect(res.body.reply).toMatch(/Gate B/);
  });

  test('handles unknown intent gracefully', async () => {
    const res = await request(app).post('/api/chat').send({
      sessionId: 'sess-2',
      message: 'what time does the match start',
      language: 'en',
    }).expect(200);

    expect(res.body.intent).toBe('unknown');
  });

  test('rejects malformed chat payload', async () => {
    await request(app).post('/api/chat').send({ sessionId: '' }).expect(400);
  });

  test('recommends accessible gate with lowest count', async () => {
    const sortMock = jest.fn().mockResolvedValue(makeZone({ zoneId: 'gate-b', name: 'Gate B' }));
    Zone.findOne.mockReturnValue({ sort: sortMock });

    const res = await request(app).post('/api/chat').send({
      sessionId: 'sess-3',
      message: 'is there a wheelchair accessible route',
      language: 'en',
    }).expect(200);

    expect(res.body.intent).toBe('accessibility');
    expect(res.body.reply).toMatch(/Gate B/);
  });
});
