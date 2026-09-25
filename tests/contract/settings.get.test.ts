import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/interfaces/http/app.js';
import { issueJwt } from '../../src/infrastructure/auth/jwt.js';
import { createRepositories, userId } from './helpers.js';

void test('GET /api/v1/users/me/settings returns authenticated settings', async () => {
  const repositories = createRepositories();
  const response = await request(createApp({ users: repositories.users, settings: repositories.userSettings, periods: repositories.periodRepository })).get('/api/v1/users/me/settings').set('Authorization', `Bearer ${issueJwt(userId)}`);
  assert.equal(response.status, 200);
  assert.equal((response.body as { periodsMode: string }).periodsMode, 'each_month');
});