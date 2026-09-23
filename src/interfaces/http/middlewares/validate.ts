import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

type RequestParts = { params?: unknown; query?: unknown; body?: unknown };

export const validate = (schema: ZodType<RequestParts>): RequestHandler => (request, _response, next) => {
  const input: RequestParts = { params: request.params, query: request.query, body: request.body };
  const result = schema.safeParse(input);
  if (!result.success) {
    next(Object.assign(new Error('Request validation failed'), { code: 'validation_error', details: result.error.issues }));
    return;
  }
  next();
};