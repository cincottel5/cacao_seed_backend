import { randomUUID } from 'node:crypto';
import type { UUID } from '../../domain/entities/shared.js';
import type { User, UserSettings } from '../../domain/entities/user.js';
import type { UserRepository, UserSettingsRepository } from '../../domain/repositories/ports.js';
import { issueJwt } from '../../infrastructure/auth/jwt.js';
import type { VerifiedGoogleIdentity } from '../../infrastructure/auth/google.js';

export interface GoogleAuthenticationDependencies {
  users: UserRepository;
  settings: UserSettingsRepository;
  verify: (token: string) => Promise<VerifiedGoogleIdentity>;
  issueToken?: (userId: UUID) => string;
}

export const authenticateGoogleUser = async (dependencies: GoogleAuthenticationDependencies, idToken: string) => {
  const identity = await dependencies.verify(idToken);
  const existing = await dependencies.users.findByGoogleId(identity.googleId);
  const now = new Date().toISOString() as User['createdAt'];
  const user = await dependencies.users.save(existing ?? {
    id: randomUUID() as UUID, googleId: identity.googleId, email: identity.email,
    emailVerified: identity.emailVerified, name: identity.name, avatarUrl: identity.avatarUrl,
    createdAt: now, updatedAt: now
  });
  if (!existing && !(await dependencies.settings.findByUserId(user.id))) {
    const defaults: UserSettings = { userId: user.id, currency: 'crc', language: 'es', periodsMode: 'each_month', periodsStartDays: [1], minimumPeriodDays: 7 };
    await dependencies.settings.save(defaults);
  }
  return { created: !existing, token: (dependencies.issueToken ?? issueJwt)(user.id), user };
};