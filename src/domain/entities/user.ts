import type { Currency, DecimalString, ISODate, UUID } from './shared.js';

export interface User {
  id: UUID;
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatarUrl: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface UserSettings {
  userId: UUID;
  currency: Currency;
  language: 'es' | 'en';
  periodsMode: 'at_demand' | 'biweekly' | 'each_month' | 'weekly' | 'range';
  periodsStartDays: number[];
  minimumPeriodDays: number;
}

export type Money = DecimalString;