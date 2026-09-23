import { Pool, type PoolConfig } from 'pg';
import { env } from '../../config/env.js';

export const createPool = (config: PoolConfig = { connectionString: env.DATABASE_URL }) =>
  new Pool(config);

export const closePool = async (pool: Pool): Promise<void> => {
  await pool.end();
};

export const checkDatabaseConnection = async (pool: Pool): Promise<boolean> => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};