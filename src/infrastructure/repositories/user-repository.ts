import type { Pool } from 'pg';
import type { UUID } from '../../domain/entities/shared.js';
import type { User } from '../../domain/entities/user.js';
import type { UserRepository } from '../../domain/repositories/ports.js';
import { BasePostgresRepository } from './base-postgres-repository.js';

type UserRow = {
  user_id: UUID; google_id: string; email: string; email_verified: boolean;
  name: string; avatar_url: string; created_at: Date | string; updated_at: Date | string;
};

const mapUser = (row: UserRow): User => ({
  id: row.user_id,
  googleId: row.google_id,
  email: row.email,
  emailVerified: row.email_verified,
  name: row.name,
  avatarUrl: row.avatar_url,
  createdAt: new Date(row.created_at).toISOString() as User['createdAt'],
  updatedAt: new Date(row.updated_at).toISOString() as User['updatedAt']
});

export class UserPostgresRepository extends BasePostgresRepository implements UserRepository {
  constructor(pool: Pool) { super(pool); }

  async findById(id: UUID): Promise<User | null> {
    const result = await this.query<UserRow>('SELECT * FROM users WHERE user_id = $1', [id]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const result = await this.query<UserRow>('SELECT * FROM users WHERE google_id = $1', [googleId]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async save(user: User): Promise<User> {
    const result = await this.query<UserRow>(
      `INSERT INTO users (user_id, google_id, email, email_verified, name, avatar_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (google_id) DO UPDATE SET email = EXCLUDED.email, email_verified = EXCLUDED.email_verified,
         name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [user.id, user.googleId, user.email, user.emailVerified, user.name, user.avatarUrl, user.createdAt, user.updatedAt]
    );
    return mapUser(this.requireRow(result.rows[0], 'User'));
  }
}