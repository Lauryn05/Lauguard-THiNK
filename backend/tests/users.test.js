const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const usersRouter = require('../routes/users');

jest.mock('../db', () => ({
  query: jest.fn(),
}));
jest.mock('bcrypt');

const pool = require('../db');

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

describe('Users API', () => {
  afterEach(() => jest.clearAllMocks());

  test('POST /api/users should create a new user', async () => {
    bcrypt.hash.mockResolvedValueOnce('hashed123');
    pool.query.mockResolvedValueOnce({
      rows: [{ user_id: 1, username: 'testuser', email: 'test@example.com' }],
    });

    const res = await request(app).post('/api/users').send({
      username: 'testuser',
      full_name: 'Test User',
      email: 'test@example.com',
      department_id: 1,
      passwd: 'password123',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.username).toBe('testuser');
  });

  test('POST /api/users should return 400 if fields missing', async () => {
    const res = await request(app).post('/api/users').send({ username: 'missingdata' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/users should return 409 if duplicate email', async () => {
    bcrypt.hash.mockResolvedValueOnce('hashed123');
    const error = new Error('duplicate key');
    error.code = '23505';
    pool.query.mockRejectedValueOnce(error);

    const res = await request(app).post('/api/users').send({
      username: 'dupuser',
      full_name: 'Duplicate',
      email: 'dup@example.com',
      department_id: 1,
      passwd: 'password',
    });
    expect(res.statusCode).toBe(409);
  });
});
