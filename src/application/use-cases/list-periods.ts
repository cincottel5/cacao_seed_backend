import type { UUID } from '../../domain/entities/shared.js';
import type { PeriodRepository } from '../../domain/repositories/ports.js';

export const listPeriods = (repository: PeriodRepository, userId: UUID, options: { page: number; pageSize: number; from?: string; to?: string }) => repository.list(userId, options);

export const getCurrentPeriod = async (repository: PeriodRepository, userId: UUID) => {
  const period = await repository.findCurrent(userId);
  if (!period) throw Object.assign(new Error('No open period exists'), { code: 'not_found' });
  return period;
};