import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Pool } = pkg;

let poolInstance = null;

export async function createPool() {
  if (poolInstance) return poolInstance;
  poolInstance = new Pool({
    host: process.env.PGHOST || '127.0.0.1',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'radius',
    user: process.env.PGUSER || 'radius',
    password: process.env.PGPASSWORD || 'radius',
    max: 20,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000
  });
  return poolInstance;
}

export async function query(sql, params = []) {
  const pool = await createPool();
  return pool.query(sql, params);
}


