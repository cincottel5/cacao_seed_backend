import type { RequestHandler } from 'express';
import { authenticateGoogleUser } from '../../../application/use-cases/authenticate-google-user.js';
import type { UserRepository, UserSettingsRepository } from '../../../domain/repositories/ports.js';
import { verifyGoogleIdToken } from '../../../infrastructure/auth/google.js';
import { issueJwt } from '../../../infrastructure/auth/jwt.js';

export const createAuthController = (users: UserRepository, settings: UserSettingsRepository, verify = verifyGoogleIdToken) => ({
  google: async (request: Parameters<RequestHandler>[0], response: Parameters<RequestHandler>[1]) => {
    try {
      const body = request.body as { idToken: string };
      const result = await authenticateGoogleUser({ users, settings, verify, issueToken: issueJwt }, body.idToken);
      response.status(result.created ? 201 : 200).json({ token: result.token, user: { id: result.user.id, email: result.user.email, name: result.user.name, avatarUrl: result.user.avatarUrl } });
    } catch (error) {
      throw Object.assign(error instanceof Error ? error : new Error('Google authentication failed'), { code: 'authentication_error' });
    }
  }
});