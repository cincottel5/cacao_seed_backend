import type { RequestHandler } from 'express';
import { verifyJwt } from '../../../infrastructure/auth/jwt.js';
import type { UUID } from '../../../domain/entities/shared.js';

declare module 'express-serve-static-core' {
  interface Request { userId?: UUID; }
}

export const requireAuth: RequestHandler = (request, _response, next) => {
  const header = request.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    next(Object.assign(new Error('Authentication is required'), { code: 'authentication_error' }));
    return;
  }
  try {
    request.userId = verifyJwt(header.slice('Bearer '.length).trim()).sub;
    next();
  } catch {
    next(Object.assign(new Error('Invalid authentication token'), { code: 'authentication_error' }));
  }
};