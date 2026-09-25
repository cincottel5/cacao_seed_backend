import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/interfaces/http/app.js';
import { issueJwt } from '../../src/infrastructure/auth/jwt.js';
import { createRepositories, userId } from './helpers.js';

void test('GET /api/v1/periods returns paginated periods', async () => {
  const repositories = createRepositories();
  const response = await request(createApp({ users: repositories.users, settings: repositories.userSettings, periods: repositories.periodRepository })).get('/api/v1/periods?page=1&pageSize=20').set('Authorization', `Bearer ${issueJwt(userId)}`);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { items: [], page: 1, pageSize: 20, total: 0 });
});