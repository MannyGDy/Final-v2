import { Router } from 'express';
import { Parser } from 'json2csv';
import { query } from '../db.js';

export const router = Router();

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin === true) return next();
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
}

router.get('/overview', requireAdmin, async (req, res) => {
  // Totals
  const totalUsers = await query('SELECT COUNT(*)::int AS c FROM portal_users');
  const activeUsers = await query("SELECT COUNT(DISTINCT username)::int AS c FROM radacct WHERE acctstarttime >= NOW() - INTERVAL '24 hours'");
  const totalData = await query('SELECT COALESCE(SUM(acctinputoctets + acctoutputoctets),0)::bigint AS bytes FROM radacct');
  res.json({ ok: true, totals: { totalUsers: totalUsers.rows[0].c, activeUsers: activeUsers.rows[0].c, totalBytes: totalData.rows[0].bytes } });
});

router.get('/per-user', requireAdmin, async (req, res) => {
  const sql = `
    SELECT
      rc.username,
      COALESCE(pu.full_name, rc.username) AS full_name,
      COALESCE(pu.company_name, '') AS company_name,
      COUNT(ra.radacctid)::int AS sessions,
      MAX(ra.acctstarttime) AS last_login,
      COALESCE(SUM(ra.acctsessiontime),0)::bigint AS total_seconds,
      COALESCE(SUM(ra.acctinputoctets),0)::bigint AS input_octets,
      COALESCE(SUM(ra.acctoutputoctets),0)::bigint AS output_octets
    FROM radcheck rc
    LEFT JOIN portal_users pu ON pu.email = rc.username
    LEFT JOIN radacct ra ON ra.username = rc.username
    WHERE rc.attribute = 'Cleartext-Password'
    GROUP BY rc.username, pu.full_name, pu.company_name
    ORDER BY last_login DESC NULLS LAST
  `;
  const result = await query(sql);
  res.json({ ok: true, users: result.rows });
});

router.get('/per-user.csv', requireAdmin, async (req, res) => {
  const result = await query(`
    SELECT
      rc.username,
      COALESCE(pu.full_name, rc.username) AS full_name,
      COALESCE(pu.company_name, '') AS company_name,
      COUNT(ra.radacctid)::int AS sessions,
      MAX(ra.acctstarttime) AS last_login,
      COALESCE(SUM(ra.acctsessiontime),0)::bigint AS total_seconds,
      COALESCE(SUM(ra.acctinputoctets),0)::bigint AS input_octets,
      COALESCE(SUM(ra.acctoutputoctets),0)::bigint AS output_octets
    FROM radcheck rc
    LEFT JOIN portal_users pu ON pu.email = rc.username
    LEFT JOIN radacct ra ON ra.username = rc.username
    WHERE rc.attribute = 'Cleartext-Password'
    GROUP BY rc.username, pu.full_name, pu.company_name
    ORDER BY last_login DESC NULLS LAST
  `);
  const parser = new Parser({ fields: ['username', 'full_name', 'company_name', 'sessions', 'last_login', 'total_seconds', 'input_octets', 'output_octets'] });
  const csv = parser.parse(result.rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="per-user-stats.csv"');
  res.send(csv);
});


