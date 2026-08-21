const request = require('supertest');
const express = require('express');
const promptsRouter = require('../routes/prompts');
const pool = require('../db');

jest.mock('../db', () => ({
  query: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/prompts', promptsRouter);

describe('Prompts API', () => {
  afterEach(() => jest.clearAllMocks());

  test('GET /api/prompts should return recent prompts', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, prompt: 'Hello AI', department: 'IT', severity: 'low', timestamp: '2025-10-10' }],
    });

    const res = await request(app).get('/api/prompts');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].prompt).toBe('Hello AI');
  });

  test('GET /api/prompts/by-department should return department counts', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ name: 'IT', value: 5 }] });
    const res = await request(app).get('/api/prompts/by-department');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].name).toBe('IT');
  });

  test('GET /api/prompts/stats should return dashboard metrics', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ value: 100 }] }) // totalPrompts
      .mockResolvedValueOnce({ rows: [{ value: 5 }] })   // adversarial
      .mockResolvedValueOnce({ rows: [{ value: 3 }] })   // activeDepartments
      .mockResolvedValueOnce({ rows: [{ value: 4 }] });  // securityRules

    const res = await request(app).get('/api/prompts/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body.totalPrompts).toBe(100);
    expect(res.body.adversarialAttempts).toBe(5);
  });

  test('GET /api/prompts should handle database failure', async () => {
    pool.query.mockRejectedValueOnce(new Error('Query failed'));
    const res = await request(app).get('/api/prompts');
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Database query failed');
  });
});
