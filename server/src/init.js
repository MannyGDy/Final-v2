import { query } from './db.js';

export async function ensureSchema() {
  // Ensure metadata table for portal users exists
  await query(`
    CREATE TABLE IF NOT EXISTS portal_users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      company_name TEXT,
      email TEXT UNIQUE NOT NULL,
      phone_number TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_portal_users_email ON portal_users(email);
    CREATE INDEX IF NOT EXISTS idx_portal_users_created_at ON portal_users(created_at);
  `);
}


