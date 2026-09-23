import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from './pool.js';

const migrationsDirectory = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

const migrationFiles = async () =>
  (await readdir(migrationsDirectory))
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();

export const migrate = async (): Promise<void> => {
  const pool = createPool();
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const file of await migrationFiles()) {
      const applied = await pool.query<{ version: string }>(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [file]
      );
      if (applied.rowCount) continue;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(await readFile(join(migrationsDirectory, file), 'utf8'));
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}