import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePeriodLifecycle } from '../../src/application/use-cases/evaluate-period-lifecycle.js';
import type { Period } from '../../src/domain/entities/period.js';
import type { PeriodRepository } from '../../src/domain/repositories/ports.js';
import type { UUID } from '../../src/domain/entities/shared.js';
import type { UserSettings } from '../../src/domain/entities/user.js';

const userId = '00000000-0000-0000-0000-000000000001' as UUID;
const settings = (periodsMode: UserSettings['periodsMode'], minimumPeriodDays = 7): UserSettings => ({
  userId, currency: 'crc', language: 'es', periodsMode, periodsStartDays: [1], minimumPeriodDays
});

const fakeRepository = (initial: Period | null): PeriodRepository & { periods: Period[] } => {
  const periods = initial ? [initial] : [];
  return {
    periods,
    findCurrent() { return Promise.resolve(periods.find((period) => period.endDate === null) ?? null); },
    list() { return Promise.resolve({ items: periods, page: 1, pageSize: 20, total: periods.length }); },
    create(period) { periods.push(period); return Promise.resolve(period); },
    close(id, endDate) { const period = periods.find((item) => item.id === id); assert.ok(period); period.endDate = endDate as Period['endDate']; return Promise.resolve(period); }
  };
};

void test('creates the first period on the first transaction', async () => {
  const periods = fakeRepository(null);
  const period = await evaluatePeriodLifecycle({ periods, getSettings: () => Promise.resolve(settings('each_month')) }, userId, '2026-01-03');
  assert.equal(period.startDate, '2026-01-03');
  assert.equal(period.endDate, null);
});

void test('advances monthly periods at the configured boundary', async () => {
  const periods = fakeRepository({ id: '00000000-0000-0000-0000-000000000002' as UUID, userId, startDate: '2026-01-01' as Period['startDate'], endDate: null });
  const current = await evaluatePeriodLifecycle({ periods, getSettings: () => Promise.resolve(settings('each_month')) }, userId, '2026-02-03');
  assert.equal(periods.periods[0]?.endDate, '2026-01-31');
  assert.equal(current.startDate, '2026-02-01');
});

void test('resolves a configured day beyond the month length', async () => {
  const periods = fakeRepository({ id: '00000000-0000-0000-0000-000000000003' as UUID, userId, startDate: '2026-01-31' as Period['startDate'], endDate: null });
  const current = await evaluatePeriodLifecycle({ periods, getSettings: () => Promise.resolve({ ...settings('each_month'), periodsStartDays: [31] }) }, userId, '2026-03-01');
  assert.equal(periods.periods[0]?.endDate, '2026-02-27');
  assert.equal(current.startDate, '2026-02-28');
});

void test('keeps on-demand periods until the minimum elapsed days', async () => {
  const periods = fakeRepository({ id: '00000000-0000-0000-0000-000000000004' as UUID, userId, startDate: '2026-01-01' as Period['startDate'], endDate: null });
  const dependencies = { periods, getSettings: () => Promise.resolve(settings('at_demand', 7)) };
  assert.equal((await evaluatePeriodLifecycle(dependencies, userId, '2026-01-04')).id, periods.periods[0]?.id);
  const next = await evaluatePeriodLifecycle(dependencies, userId, '2026-01-09');
  assert.equal(periods.periods[0]?.endDate, '2026-01-08');
  assert.equal(next.startDate, '2026-01-09');
});