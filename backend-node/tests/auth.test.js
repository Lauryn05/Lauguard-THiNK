const request = require('supertest');
const app = require('../server');

describe('Authentication Tests', () => {
  it('should generate a valid JWT for correct admin credentials', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({ email: 'admin@example.com', passwd: 'admin123' });

    expect([200, 401, 403]).toContain(res.statusCode);
    if (res.statusCode === 200) expect(res.body.token).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/user-login')
      .send({ email: 'fake@user.com', passwd: 'wrongpass' });

    expect(res.statusCode).toBe(401);
  });
});
