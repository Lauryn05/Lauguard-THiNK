const request = require('supertest');
const express = require('express');
const departmentsRouter = require('../routes/departments');

const app = express();
app.use(express.json());
app.use('/api/departments', departmentsRouter);

jest.mock('../db', () => ({
  query: jest.fn(),
}));
const pool = require('../db');

describe('Departments API', () => {
  afterEach(() => jest.clearAllMocks());

  test('should fetch all departments', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { department_id: 1, department_name: 'IT' },
        { department_id: 2, department_name: 'HR' },
      ],
    });

    const res = await request(app).get('/api/departments');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].department_name).toBe('IT');
  });

  test('should return 500 on database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB Error'));
    const res = await request(app).get('/api/departments');
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});
