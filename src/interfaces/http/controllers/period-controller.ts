import type { RequestHandler } from 'express';
import { getCurrentPeriod, listPeriods } from '../../../application/use-cases/list-periods.js';
import type { PeriodRepository } from '../../../domain/repositories/ports.js';
import type { UUID } from '../../../domain/entities/shared.js';

const userId = (request: Parameters<RequestHandler>[0]): UUID => {
  if (!request.userId) throw Object.assign(new Error('Authentication is required'), { code: 'authentication_error' });
  return request.userId;
};

export const createPeriodController = (periods: PeriodRepository) => ({
  list: async (request: Parameters<RequestHandler>[0], response: Parameters<RequestHandler>[1]) => {
    const query = request.query as { page?: string; pageSize?: string; from?: string; to?: string };
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 20);
    response.json(await listPeriods(periods, userId(request), { page, pageSize, from: query.from, to: query.to }));
  },
  current: async (request: Parameters<RequestHandler>[0], response: Parameters<RequestHandler>[1]) => response.json(await getCurrentPeriod(periods, userId(request)))
});