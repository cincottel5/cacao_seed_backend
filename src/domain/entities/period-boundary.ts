import type { UserSettings } from './user.js';

export type PeriodMode = UserSettings['periodsMode'];

const toDate = (value: string): Date => {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ISO date: ${value}`);
  return date;
};

export const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

export const addDays = (dateValue: string, days: number): string => {
  const date = toDate(dateValue);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
};

const startOfConfiguredMonth = (date: Date, startDay: number): Date => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(startDay, lastDay)));
};

export const nextPeriodStart = (dateValue: string, settings: UserSettings): string | null => {
  const date = toDate(dateValue);
  switch (settings.periodsMode) {
    case 'weekly':
      return addDays(dateValue, 7);
    case 'biweekly':
      return addDays(dateValue, 14);
    case 'range': {
      const startDay = settings.periodsStartDays[0] ?? 1;
      const candidate = startOfConfiguredMonth(date, startDay);
      if (candidate.getTime() <= date.getTime()) {
        return formatDate(startOfConfiguredMonth(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)), startDay));
      }
      return formatDate(candidate);
    }
    case 'each_month': {
      const startDay = settings.periodsStartDays[0] ?? 1;
      const nextMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
      return formatDate(startOfConfiguredMonth(nextMonth, startDay));
    }
    case 'at_demand':
      return null;
  }
};

export const periodBoundaryFor = (periodStart: string, settings: UserSettings): string | null =>
  nextPeriodStart(periodStart, settings);