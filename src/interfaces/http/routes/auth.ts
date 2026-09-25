import { Router } from 'express';
import { createAuthController } from '../controllers/auth-controller.js';
import { validate } from '../middlewares/validate.js';
import { googleAuthRequestSchema } from '../schemas/auth.js';
import type { UserRepository, UserSettingsRepository } from '../../../domain/repositories/ports.js';
import type { VerifiedGoogleIdentity } from '../../../infrastructure/auth/google.js';

export const createAuthRouter = (users: UserRepository, settings: UserSettingsRepository, verify?: (token: string) => Promise<VerifiedGoogleIdentity>): Router => {
  const controller = createAuthController(users, settings, verify);
  const router = Router();
  router.post('/auth/google', validate(googleAuthRequestSchema), controller.google);
  return router;
};