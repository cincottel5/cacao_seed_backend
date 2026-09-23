import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1).default('7d'),
  GOOGLE_CLIENT_ID: z.string().min(1),
  ENVIRONMENT: z.string().min(1).default('development')
});

export type Environment = z.infer<typeof environmentSchema>;

export const env: Environment = environmentSchema.parse(process.env);
