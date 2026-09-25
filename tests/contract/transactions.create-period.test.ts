import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePeriodLifecycle } from '../../src/application/use-cases/evaluate-period-lifecycle.js';
import { createRepositories, userId } from './helpers.js';

void test('transaction lifecycle integration creates and advances a shared period before recording', async () => {
  const repositories = createRepositories();
  const first = await evaluatePeriodLifecycle({ periods: repositories.periodRepository, getSettings: () => Promise.resolve(repositories.getSettings()) }, userId, '2026-01-01');
  const next = await evaluatePeriodLifecycle({ periods: repositories.periodRepository, getSettings: () => Promise.resolve(repositories.getSettings()) }, userId, '2026-02-01');
  assert.equal(first.endDate, '2026-01-31');
  assert.equal(next.startDate, '2026-02-01');
});