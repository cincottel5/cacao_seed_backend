import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/error-handler.js';
import { env } from '../../config/env.js';
import { createPool } from '../../infrastructure/db/pool.js';
import { createHealthRouter } from './routes/health.js';
import { UserPostgresRepository } from '../../infrastructure/repositories/user-repository.js';
import { UserSettingsPostgresRepository } from '../../infrastructure/repositories/user-settings-repository.js';
import { PeriodPostgresRepository } from '../../infrastructure/repositories/period-repository.js';
import { createAuthRouter } from './routes/auth.js';
import { createSettingsRouter } from './routes/settings.js';
import { createPeriodsRouter } from './routes/periods.js';
import { createMeRouter } from './routes/me.js';
import type { UserRepository, UserSettingsRepository, PeriodRepository } from '../../domain/repositories/ports.js';
import type { VerifiedGoogleIdentity } from '../../infrastructure/auth/google.js';

export interface AppDependencies {
  pool?: ReturnType<typeof createPool>;
  users?: UserRepository;
  settings?: UserSettingsRepository;
  periods?: PeriodRepository;
  verifyGoogleToken?: (token: string) => Promise<VerifiedGoogleIdentity>;
}

export const createApp = (dependencies: AppDependencies = {}) => {
  const app = express();
  const pool = dependencies.pool ?? createPool();
  const users = dependencies.users ?? new UserPostgresRepository(pool);
  const settings = dependencies.settings ?? new UserSettingsPostgresRepository(pool);
  const periods = dependencies.periods ?? new PeriodPostgresRepository(pool);

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use('/api/v1', createHealthRouter(pool, env.ENVIRONMENT));
  app.use('/api/v1', createAuthRouter(users, settings, dependencies.verifyGoogleToken));
  app.use('/api/v1', createMeRouter(users));
  app.use('/api/v1', createSettingsRouter(settings));
  app.use('/api/v1', createPeriodsRouter(periods));

  app.use((_req, _res, next) => {
    next(Object.assign(new Error('Route not found'), { code: 'not_found' }));
  });

  app.use(errorHandler);
  return app;
};

export const app = createApp();
