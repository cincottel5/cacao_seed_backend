import 'dotenv/config';
import process from 'node:process';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.coerce.number().int().positive().default(3600),
  GOOGLE_CLIENT_ID: z.string().min(1)
});

export type AppEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
