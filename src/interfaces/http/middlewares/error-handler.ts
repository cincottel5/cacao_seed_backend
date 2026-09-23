import type { ErrorRequestHandler } from 'express';

const statusByCode: Record<string, number> = {
  validation_error: 400,
  authentication_error: 401,
  authorization_error: 403,
  not_found: 404,
  conflict: 409
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const candidate = error as { code?: unknown; status?: unknown; details?: unknown };
  const code = typeof candidate.code === 'string' ? candidate.code : 'internal_error';
  const status = statusByCode[code] ?? (typeof candidate.status === 'number' ? candidate.status : 500);
  response.status(status).json({
    error: { code, message: error instanceof Error ? error.message : 'Unexpected error', details: candidate.details ?? [] }
  });
};