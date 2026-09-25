import type { Pool } from 'pg';
import type { Period, PeriodPage } from '../../domain/entities/period.js';
import type { UUID } from '../../domain/entities/shared.js';
import type { PeriodRepository } from '../../domain/repositories/ports.js';
import { BasePostgresRepository } from './base-postgres-repository.js';

type PeriodRow = { period_id: UUID; user_id: UUID; start_date: string; end_date: string | null };
const mapPeriod = (row: PeriodRow): Period => ({ id: row.period_id, userId: row.user_id, startDate: row.start_date as Period['startDate'], endDate: row.end_date as Period['endDate'] });

export class PeriodPostgresRepository extends BasePostgresRepository implements PeriodRepository {
  constructor(pool: Pool) { super(pool); }

  async findCurrent(userId: UUID): Promise<Period | null> {
    const result = await this.query<PeriodRow>('SELECT * FROM periods WHERE user_id = $1 AND end_date IS NULL ORDER BY start_date DESC LIMIT 1', [userId]);
    return result.rows[0] ? mapPeriod(result.rows[0]) : null;
  }

  async list(userId: UUID, options: { page: number; pageSize: number; from?: string; to?: string }): Promise<PeriodPage> {
    const filters = ['user_id = $1'];
    const values: unknown[] = [userId];
    if (options.from) { values.push(options.from); filters.push(`start_date >= $${values.length}`); }
    if (options.to) { values.push(options.to); filters.push(`start_date <= $${values.length}`); }
    const where = filters.join(' AND ');
    const count = await this.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM periods WHERE ${where}`, values);
    const offset = (options.page - 1) * options.pageSize;
    values.push(options.pageSize, offset);
    const rows = await this.query<PeriodRow>(`SELECT * FROM periods WHERE ${where} ORDER BY start_date DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { items: rows.rows.map(mapPeriod), page: options.page, pageSize: options.pageSize, total: Number(count.rows[0]?.count ?? 0) };
  }

  async create(period: Period): Promise<Period> {
    const result = await this.query<PeriodRow>('INSERT INTO periods (period_id, user_id, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *', [period.id, period.userId, period.startDate, period.endDate]);
    return mapPeriod(this.requireRow(result.rows[0], 'Period'));
  }

  async close(id: UUID, endDate: string): Promise<Period> {
    const result = await this.query<PeriodRow>('UPDATE periods SET end_date = $2 WHERE period_id = $1 RETURNING *', [id, endDate]);
    return mapPeriod(this.requireRow(result.rows[0], 'Period'));
  }
}