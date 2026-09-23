import type { Pool, QueryResultRow } from 'pg';
import type { Pagination } from '../../interfaces/http/schemas/pagination.js';

export class RepositoryError extends Error {
  constructor(public readonly code: 'not_found' | 'conflict', message: string) {
    super(message);
  }
}

export abstract class BasePostgresRepository {
  protected constructor(protected readonly pool: Pool) {}

  protected query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
    return this.pool.query<T>(text, values);
  }

  protected pageClause(pagination: Pagination): { limit: number; offset: number } {
    return { limit: pagination.pageSize, offset: (pagination.page - 1) * pagination.pageSize };
  }

  protected mapDecimal(value: string | number | null): string | null {
    return value === null ? null : String(value);
  }

  protected requireRow<T>(row: T | undefined, resource: string): T {
    if (row === undefined) throw new RepositoryError('not_found', `${resource} was not found`);
    return row;
  }

  protected translateDatabaseError(error: unknown): never {
    const code = (error as { code?: unknown }).code;
    if (code === '23505' || code === '23503') {
      throw new RepositoryError('conflict', 'The requested database operation conflicts with existing data');
    }
    throw error;
  }
}