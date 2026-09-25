import type { RequestHandler } from 'express';
import { getMe } from '../../../application/use-cases/get-me.js';
import type { UserRepository } from '../../../domain/repositories/ports.js';

export const createMeController = (users: UserRepository): RequestHandler => async (request, response) => {
  if (!request.userId) throw Object.assign(new Error('Authentication is required'), { code: 'authentication_error' });
  const user = await getMe(users, request.userId);
  response.json({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, emailVerified: user.emailVerified, createdAt: user.createdAt });
};