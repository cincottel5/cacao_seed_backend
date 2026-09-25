import { randomUUID } from 'node:crypto';
import type { Period } from '../../domain/entities/period.js';
import { addDays, periodBoundaryFor } from '../../domain/entities/period-boundary.js';
import type { UserSettings } from '../../domain/entities/user.js';
import type { UUID } from '../../domain/entities/shared.js';
import type { PeriodRepository } from '../../domain/repositories/ports.js';

export interface PeriodLifecycleDependencies {
  periods: PeriodRepository;
  getSettings: (userId: UUID) => Promise<UserSettings>;
}

const dateOnly = (value: string): string => value.slice(0, 10);

export const evaluatePeriodLifecycle = async (
  dependencies: PeriodLifecycleDependencies,
  userId: UUID,
  transactionDate: string
): Promise<Period> => {
  const date = dateOnly(transactionDate);
  const settings = await dependencies.getSettings(userId);
  let current = await dependencies.periods.findCurrent(userId);

  if (!current) {
    return dependencies.periods.create({
      id: randomUUID() as UUID,
      userId,
      startDate: date as Period['startDate'],
      endDate: null
    });
  }

  if (settings.periodsMode === 'at_demand') {
    const elapsedDays = Math.floor((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${current.startDate}T00:00:00Z`)) / 86_400_000);
    if (elapsedDays < settings.minimumPeriodDays) return current;
    await dependencies.periods.close(current.id, addDays(date, -1));
    return dependencies.periods.create({
      id: randomUUID() as UUID,
      userId,
      startDate: date as Period['startDate'],
      endDate: null
    });
  }

  let boundary = periodBoundaryFor(current.startDate, settings);
  while (boundary && date >= boundary) {
    await dependencies.periods.close(current.id, addDays(boundary, -1));
    current = await dependencies.periods.create({
      id: randomUUID() as UUID,
      userId,
      startDate: boundary as Period['startDate'],
      endDate: null
    });
    boundary = periodBoundaryFor(current.startDate, settings);
  }
  return current;
};