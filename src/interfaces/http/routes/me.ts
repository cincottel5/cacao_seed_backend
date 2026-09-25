import { Router } from 'express';
import { createMeController } from '../controllers/me-controller.js';
import { requireAuth } from '../middlewares/auth.js';
import type { UserRepository } from '../../../domain/repositories/ports.js';

export const createMeRouter = (users: UserRepository): Router => {
  const router = Router();
  router.get('/auth/me', requireAuth, createMeController(users));
  return router;
};