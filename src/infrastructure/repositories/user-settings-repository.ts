import type { Pool } from 'pg';
import type { UUID } from '../../domain/entities/shared.js';
import type { UserSettings } from '../../domain/entities/user.js';
import type { UserSettingsRepository } from '../../domain/repositories/ports.js';
import { BasePostgresRepository } from './base-postgres-repository.js';

type SettingsRow = {
  user_id: UUID; currency: UserSettings['currency']; language: UserSettings['language'];
  periods_mode: UserSettings['periodsMode']; periods_start_days: number[]; minimum_period_days: number;
};

const mapSettings = (row: SettingsRow): UserSettings => ({
  userId: row.user_id,
  currency: row.currency,
  language: row.language,
  periodsMode: row.periods_mode,
  periodsStartDays: row.periods_start_days,
  minimumPeriodDays: row.minimum_period_days
});

export class UserSettingsPostgresRepository extends BasePostgresRepository implements UserSettingsRepository {
  constructor(pool: Pool) { super(pool); }

  async findByUserId(userId: UUID): Promise<UserSettings | null> {
    const result = await this.query<SettingsRow>('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
    return result.rows[0] ? mapSettings(result.rows[0]) : null;
  }

  async save(settings: UserSettings): Promise<UserSettings> {
    const result = await this.query<SettingsRow>(
      `INSERT INTO user_settings (user_id, currency, language, periods_mode, periods_start_days, minimum_period_days)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET currency = EXCLUDED.currency, language = EXCLUDED.language,
         periods_mode = EXCLUDED.periods_mode, periods_start_days = EXCLUDED.periods_start_days,
         minimum_period_days = EXCLUDED.minimum_period_days
       RETURNING *`,
      [settings.userId, settings.currency, settings.language, settings.periodsMode, settings.periodsStartDays, settings.minimumPeriodDays]
    );
    return mapSettings(this.requireRow(result.rows[0], 'User settings'));
  }
}