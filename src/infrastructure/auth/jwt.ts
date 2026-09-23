import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import type { UUID } from '../../domain/entities/shared.js';

export interface AuthenticatedToken extends JwtPayload { sub: UUID; }

export const issueJwt = (userId: UUID): string =>
  jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] });

export const verifyJwt = (token: string): AuthenticatedToken => {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (typeof payload === 'string' || typeof payload.sub !== 'string') throw new Error('Invalid JWT subject');
  return payload as AuthenticatedToken;
};