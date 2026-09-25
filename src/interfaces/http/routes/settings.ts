import { Router } from 'express';
import { createSettingsController } from '../controllers/settings-controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { updateUserSettingsRequestSchema } from '../schemas/settings.js';
import type { UserSettingsRepository } from '../../../domain/repositories/ports.js';

export const createSettingsRouter = (settings: UserSettingsRepository): Router => {
  const controller = createSettingsController(settings);
  const router = Router();
  router.get('/users/me/settings', requireAuth, controller.get);
  router.patch('/users/me/settings', requireAuth, validate(updateUserSettingsRequestSchema), controller.update);
  return router;
};