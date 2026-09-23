import { Router, type Request, type Response } from 'express';
import type { Pool } from 'pg';
import { checkDatabaseConnection } from '../../../infrastructure/db/pool.js';
import { getHealthStatus } from '../../../application/use-cases/get-health-status.js';

export const createHealthRouter = (pool: Pool, environment: string): Router => {
  const router = Router();

  router.get('/health', async (_req: Request, res: Response) => {
    const status = await getHealthStatus({
      checkDatabaseConnection: () => checkDatabaseConnection(pool),
      environment
    });

    res.json(status);
  });

  return router;
};
