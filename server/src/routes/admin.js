import { Router } from 'express';
import Joi from 'joi';
import { Parser } from 'json2csv';
import { query } from '../db.js';

export const router = Router();

const adminUser = {
  username: process.env.ADMIN_USER || 'admin',
  password: process.env.ADMIN_PASS || 'changeme'
};

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin === true) return next();
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
}

router.post('/login', async (req, res) => {
  const schema = Joi.object({ username: Joi.string().required(), password: Joi.string().required() });
  const { value, error } = schema.validate(req.body);
  if (error) return res.status(400).json({ ok: false, error: 'Invalid payload' });
  if (value.username === adminUser.username && value.password === adminUser.password) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
});

router.post('/logout', (req, res) => {
  req.session.admin = false;
  res.json({ ok: true });
});

router.get('/users', requireAdmin, async (req, res) => {
  // Combine from portal_users if available, else derive from radcheck
  await query(
    `CREATE TABLE IF NOT EXISTS portal_users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      company_name TEXT,
      email TEXT UNIQUE NOT NULL,
      phone_number TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`
  );
  const users = await query('SELECT full_name, company_name, email, phone_number, created_at FROM portal_users ORDER BY created_at DESC');
  res.json({ ok: true, users: users.rows });
});

router.get('/users.csv', requireAdmin, async (req, res) => {
  const users = await query('SELECT full_name, company_name, email, phone_number, created_at FROM portal_users ORDER BY created_at DESC');
  const parser = new Parser({ fields: ['full_name', 'company_name', 'email', 'phone_number', 'created_at'] });
  const csv = parser.parse(users.rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
  res.send(csv);
});


