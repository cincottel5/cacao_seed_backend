import type { UUID } from '../../domain/entities/shared.js';
import type { UserSettings } from '../../domain/entities/user.js';
import type { UserSettingsRepository } from '../../domain/repositories/ports.js';

export type UserSettingsPatch = Partial<Omit<UserSettings, 'userId'>>;

export const getUserSettings = async (repository: UserSettingsRepository, userId: UUID): Promise<UserSettings> => {
  const settings = await repository.findByUserId(userId);
  if (!settings) throw Object.assign(new Error('User settings were not found'), { code: 'not_found' });
  return settings;
};

export const updateUserSettings = async (repository: UserSettingsRepository, userId: UUID, patch: UserSettingsPatch): Promise<UserSettings> => {
  const current = await getUserSettings(repository, userId);
  return repository.save({ ...current, ...patch, userId });
};