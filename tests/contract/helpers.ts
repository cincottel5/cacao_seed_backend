import type { Period, PeriodPage } from '../../src/domain/entities/period.js';
import type { UUID } from '../../src/domain/entities/shared.js';
import type { User, UserSettings } from '../../src/domain/entities/user.js';
import type { PeriodRepository, UserRepository, UserSettingsRepository } from '../../src/domain/repositories/ports.js';

export const userId = '00000000-0000-0000-0000-000000000001' as UUID;
export const user: User = { id: userId, googleId: 'google-1', email: 'user@example.com', emailVerified: true, name: 'Test User', avatarUrl: '', createdAt: '2026-01-01T00:00:00.000Z' as User['createdAt'], updatedAt: '2026-01-01T00:00:00.000Z' as User['updatedAt'] };
export const settings: UserSettings = { userId, currency: 'crc', language: 'es', periodsMode: 'each_month', periodsStartDays: [1], minimumPeriodDays: 7 };

export const createRepositories = () => {
  let currentSettings = { ...settings };
  const periods: Period[] = [];
  const users: UserRepository = { findById() { return Promise.resolve(user); }, findByGoogleId() { return Promise.resolve(user); }, findByEmail() { return Promise.resolve(user); }, save(value) { return Promise.resolve(value); } };
  const userSettings: UserSettingsRepository = { findByUserId() { return Promise.resolve(currentSettings); }, save(value) { currentSettings = value; return Promise.resolve(currentSettings); } };
  const periodRepository: PeriodRepository = {
    findCurrent() { return Promise.resolve(periods.find((period) => period.endDate === null) ?? null); },
    list(_id, options): Promise<PeriodPage> { return Promise.resolve({ items: periods, page: options.page, pageSize: options.pageSize, total: periods.length }); },
    create(period) { periods.push(period); return Promise.resolve(period); },
    close(id, endDate) { const period = periods.find((item) => item.id === id); if (!period) return Promise.reject(new Error('missing')); period.endDate = endDate as Period['endDate']; return Promise.resolve(period); }
  };
  return { users, userSettings, periodRepository, getSettings: () => currentSettings, periods };
};