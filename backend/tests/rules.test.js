const request = require('supertest');
const express = require('express');
const rulesRouter = require('../routes/rules');

jest.mock('../db', () => ({
  query: jest.fn(),
}));
const pool = require('../db');

const app = express();
app.use(express.json());
app.use('/api/rules', rulesRouter);

describe('Security Rules API', () => {
  afterEach(() => jest.clearAllMocks());

  test('GET /api/rules should return all rules', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'SQL Injection', pattern: 'SELECT.*FROM' }],
    });
    const res = await request(app).get('/api/rules');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].name).toBe('SQL Injection');
  });

  test('POST /api/rules should create a new rule', async () => {
    const newRule = {
      name: 'Test Rule',
      pattern: 'DROP TABLE',
      description: 'Detects DROP statements',
      replacement: '[blocked]',
      status: 'active',
    };
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 2, ...newRule }],
    });

    const res = await request(app).post('/api/rules').send(newRule);
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test Rule');
  });

  test('POST /api/rules should return 400 if name or pattern missing', async () => {
    const res = await request(app).post('/api/rules').send({});
    expect(res.statusCode).toBe(400);
  });

  test('PATCH /api/rules/:id should update a rule', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Updated Rule', status: 'inactive' }],
    });
    const res = await request(app).patch('/api/rules/1').send({ status: 'inactive' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('inactive');
  });

  test('PATCH /api/rules/:id should return 404 if rule not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).patch('/api/rules/99').send({ status: 'inactive' });
    expect(res.statusCode).toBe(404);
  });
});
