import { z } from 'zod';

const settingsFields = {
  currency: z.enum(['crc', 'usd']),
  language: z.enum(['es', 'en']),
  periodsMode: z.enum(['at_demand', 'biweekly', 'each_month', 'weekly', 'range']),
  periodsStartDays: z.array(z.number().int().min(1).max(31)).min(1),
  minimumPeriodDays: z.number().int().positive()
};

export const updateUserSettingsRequestSchema = z.object({ body: z.object(settingsFields).partial() });
export const settingsResponseSchema = z.object(settingsFields);