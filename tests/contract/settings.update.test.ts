import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/interfaces/http/app.js';
import { issueJwt } from '../../src/infrastructure/auth/jwt.js';
import { createRepositories, userId } from './helpers.js';

void test('PATCH /api/v1/users/me/settings updates valid settings', async () => {
  const repositories = createRepositories();
  const response = await request(createApp({ users: repositories.users, settings: repositories.userSettings, periods: repositories.periodRepository })).patch('/api/v1/users/me/settings').set('Authorization', `Bearer ${issueJwt(userId)}`).send({ periodsMode: 'at_demand', periodsStartDays: [31], minimumPeriodDays: 7 });
  assert.equal(response.status, 200);
  assert.equal((response.body as { periodsStartDays: number[] }).periodsStartDays[0], 31);
});

void test('PATCH /api/v1/users/me/settings rejects invalid period days', async () => {
  const repositories = createRepositories();
  const response = await request(createApp({ users: repositories.users, settings: repositories.userSettings, periods: repositories.periodRepository })).patch('/api/v1/users/me/settings').set('Authorization', `Bearer ${issueJwt(userId)}`).send({ periodsStartDays: [0] });
  assert.equal(response.status, 400);
});