import { z } from 'zod';

export const periodsListRequestSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    from: z.string().date().optional(),
    to: z.string().date().optional()
  })
});