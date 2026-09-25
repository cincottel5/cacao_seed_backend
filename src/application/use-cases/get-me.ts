import type { UUID } from '../../domain/entities/shared.js';
import type { UserRepository } from '../../domain/repositories/ports.js';

export const getMe = async (users: UserRepository, userId: UUID) => {
  const user = await users.findById(userId);
  if (!user) throw Object.assign(new Error('User was not found'), { code: 'not_found' });
  return user;
};