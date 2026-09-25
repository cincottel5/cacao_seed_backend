import type { RequestHandler } from 'express';
import { getUserSettings, updateUserSettings } from '../../../application/use-cases/update-user-settings.js';
import type { UserSettingsRepository } from '../../../domain/repositories/ports.js';
import type { UUID } from '../../../domain/entities/shared.js';
import type { UserSettingsPatch } from '../../../application/use-cases/update-user-settings.js';

const userId = (request: Parameters<RequestHandler>[0]): UUID => {
  if (!request.userId) throw Object.assign(new Error('Authentication is required'), { code: 'authentication_error' });
  return request.userId;
};

export const createSettingsController = (settings: UserSettingsRepository) => ({
  get: async (request: Parameters<RequestHandler>[0], response: Parameters<RequestHandler>[1]) => response.json(await getUserSettings(settings, userId(request))),
  update: async (request: Parameters<RequestHandler>[0], response: Parameters<RequestHandler>[1]) => response.json(await updateUserSettings(settings, userId(request), request.body as UserSettingsPatch))
});