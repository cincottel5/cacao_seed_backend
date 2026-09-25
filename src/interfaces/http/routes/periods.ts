import { Router } from 'express';
import { createPeriodController } from '../controllers/period-controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { periodsListRequestSchema } from '../schemas/periods.js';
import type { PeriodRepository } from '../../../domain/repositories/ports.js';

export const createPeriodsRouter = (periods: PeriodRepository): Router => {
  const controller = createPeriodController(periods);
  const router = Router();
  router.get('/periods', requireAuth, validate(periodsListRequestSchema), controller.list);
  router.get('/periods/current', requireAuth, controller.current);
  return router;
};