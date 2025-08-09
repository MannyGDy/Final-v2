import { Router } from 'express';
import Joi from 'joi';
import { query } from '../db.js';
import { addHotspotUser, authorizeByAddressList } from '../utils/mikrotik.js';

export const router = Router();

const signupSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  companyName: Joi.string().allow('').max(120),
  email: Joi.string().email().max(150).required(),
  phoneNumber: Joi.string().pattern(/^[0-9+\-()\s]{7,20}$/).required()
});

router.post('/signup', async (req, res) => {
  const { value, error } = signupSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ ok: false, error: 'Validation failed', details: error.details });

  const { fullName, companyName, email, phoneNumber } = value;
  try {
    await query('BEGIN');
    const existsEmail = await query('SELECT 1 FROM radcheck WHERE username = $1 LIMIT 1', [email]);
    if (existsEmail.rowCount > 0) {
      await query('ROLLBACK');
      return res.status(409).json({ ok: false, error: 'Email already registered' });
    }
    const existsPhone = await query("SELECT 1 FROM radcheck WHERE attribute = 'Cleartext-Password' AND value = $1 LIMIT 1", [phoneNumber]);
    if (existsPhone.rowCount > 0) {
      await query('ROLLBACK');
      return res.status(409).json({ ok: false, error: 'Phone number already registered' });
    }

    // Insert into a local users table (if not exists) for display, fallback to radcheck only
    await query(
      'INSERT INTO radcheck (username, attribute, op, value) VALUES ($1, $2, $3, $4)',
      [email, 'Cleartext-Password', ':=', phoneNumber]
    );

    // Ensure portal_users exists for admin listing
    await query(`CREATE TABLE IF NOT EXISTS portal_users (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        company_name TEXT,
        email TEXT UNIQUE NOT NULL,
        phone_number TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`);
    await query(
      'INSERT INTO portal_users (full_name, company_name, email, phone_number) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING',
      [fullName, companyName || '', email, phoneNumber]
    );

    await query('COMMIT');
    return res.json({ ok: true });
  } catch (err) {
    try { await query('ROLLBACK'); } catch {}
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const signinSchema = Joi.object({
  email: Joi.string().email().max(150).required(),
  phoneNumber: Joi.string().pattern(/^[0-9+\-()\s]{7,20}$/).required(),
  clientIp: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).allow('').default('')
});

router.post('/signin', async (req, res) => {
  const { value, error } = signinSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ ok: false, error: 'Validation failed', details: error.details });

  const { email, phoneNumber, clientIp } = value;
  try {
    const result = await query(
      "SELECT 1 FROM radcheck WHERE username = $1 AND attribute = 'Cleartext-Password' AND value = $2 LIMIT 1",
      [email, phoneNumber]
    );
    if (result.rowCount === 0) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    // MikroTik integration (optional if MT_HOST not set)
    const mt = {
      host: process.env.MT_HOST,
      user: process.env.MT_USER,
      password: process.env.MT_PASSWORD,
      tls: process.env.MT_TLS === 'true',
      port: process.env.MT_PORT || 8728
    };
    const sessionId = `${email}-${Date.now()}`;

    if (mt.host) {
      const addUser = await addHotspotUser({
        host: mt.host,
        user: mt.user,
        password: mt.password,
        tls: mt.tls,
        port: mt.port,
        username: email,
        profile: 'default',
        comment: sessionId
      });
      if (!addUser.ok) return res.status(502).json({ ok: false, error: `MikroTik error: ${addUser.error}` });

      if (clientIp) {
        const allow = await authorizeByAddressList({
          host: mt.host, user: mt.user, password: mt.password, tls: mt.tls, port: mt.port,
          ipAddress: clientIp, comment: sessionId
        });
        if (!allow.ok) return res.status(502).json({ ok: false, error: `MikroTik error: ${allow.error}` });
      }
    }

    req.session.user = { email, sessionId };
    return res.json({ ok: true, sessionId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/signout', async (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});


