import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/interfaces/http/app.js';
import { createRepositories } from './helpers.js';

const identity = { googleId: 'google-new', email: 'new@example.com', emailVerified: true, name: 'New User', avatarUrl: '' };

void test('POST /api/v1/auth/google returns the existing-user response', async () => {
  const repositories = createRepositories();
  const app = createApp({
    users: repositories.users,
    settings: repositories.userSettings,
    periods: repositories.periodRepository,
    verifyGoogleToken: () => Promise.resolve(identity)
  });
  const first = await request(app).post('/api/v1/auth/google').send({ idToken: 'valid' });
  assert.equal(first.status, 200);
  assert.equal(typeof (first.body as { token: string }).token, 'string');
});

void test('GET /api/v1/auth/me requires a JWT and returns the profile', async () => {
  const repositories = createRepositories();
  const app = createApp({ users: repositories.users, settings: repositories.userSettings, periods: repositories.periodRepository });
  const response = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${process.env.TEST_JWT ?? ''}`);
  assert.equal(response.status, 401);
});