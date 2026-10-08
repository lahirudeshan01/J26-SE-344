const request = require('supertest');
const app = require('../app');

describe('health endpoints', () => {
  test.each([
    ['/api/health', 'backend'],
    ['/api/skills-trainer/health', 'skills-trainer'],
    ['/api/assessment-engine/health', 'assessment-engine'],
    ['/api/content-engine/health', 'content-engine'],
    ['/api/digital-twin/health', 'digital-twin'],
  ])('GET %s identifies the %s service', async (path, service) => {
    const response = await request(app).get(path);

    expect(response.status).toBe(200);
    expect(response.body.service).toBe(service);
  });
});
