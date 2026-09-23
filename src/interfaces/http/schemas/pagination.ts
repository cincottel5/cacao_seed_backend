import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type Pagination = z.infer<typeof paginationSchema>;

export const parsePagination = (input: unknown): Pagination => paginationSchema.parse(input);

export const paginationOffset = ({ page, pageSize }: Pagination) => ({
  limit: pageSize,
  offset: (page - 1) * pageSize
});