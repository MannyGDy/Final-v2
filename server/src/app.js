import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import session from 'express-session';
import pgSimpleFactory from 'connect-pg-simple';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createPool } from './db.js';
import { ensureSchema } from './init.js';
import { router as authRouter } from './routes/auth.js';
import { router as adminRouter } from './routes/admin.js';
import { router as statsRouter } from './routes/stats.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Respect reverse proxies (e.g., Nginx) when deployed publicly
const trustProxyEnv = process.env.TRUST_PROXY || '';
if (trustProxyEnv) {
  let trustValue;
  if (trustProxyEnv === 'true') trustValue = 1;
  else if (trustProxyEnv === 'false') trustValue = false;
  else if (!Number.isNaN(Number(trustProxyEnv))) trustValue = Number(trustProxyEnv);
  else trustValue = trustProxyEnv; // e.g., 'loopback', '127.0.0.1'
  app.set('trust proxy', trustValue);
}

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "data:"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "font-src": ["'self'", "data:"],
      "connect-src": ["'self'"]
    }
  }
}));

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pgSession = pgSimpleFactory(session);
const sessionSecret = process.env.SESSION_SECRET || 'change-me';
app.use(
  session({
    name: 'cp.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new pgSession({
      createTableIfMissing: true,
      conObject: {
        host: process.env.PGHOST || '127.0.0.1',
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE || 'radius',
        user: process.env.PGUSER || 'radius',
        password: process.env.PGPASSWORD || 'radius',
        ssl: (process.env.PGSSL === 'true') ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false' } : undefined
      }
    }),
    cookie: {
      httpOnly: true,
      sameSite: (process.env.COOKIE_SAMESITE || 'lax'),
      // If behind a proxy/HTTPS, set COOKIE_SECURE=auto (or true) and TRUST_PROXY appropriately
      secure: (process.env.COOKIE_SECURE === 'true' ? true : (process.env.COOKIE_SECURE === 'auto' ? 'auto' : false)),
      maxAge: process.env.SESSION_TTL_SECONDS ? Number(process.env.SESSION_TTL_SECONDS) * 1000 : undefined
    }
  })
);

// Static assets (allow override). Prefer env PUBLIC_DIR, else try project-level web, else server/web
const publicDir = (() => {
  const envPath = process.env.PUBLIC_DIR ? path.resolve(process.env.PUBLIC_DIR) : null;
  const projectWeb = path.resolve(__dirname, '../../web');
  const serverWeb = path.resolve(__dirname, '../web');
  if (envPath && fs.existsSync(envPath)) return envPath;
  if (fs.existsSync(projectWeb)) return projectWeb;
  return serverWeb;
})();
app.use('/', express.static(publicDir, { maxAge: '7d', extensions: ['html'] }));

// Dependency health check
app.get('/health', async (req, res) => {
  try {
    const pool = await createPool();
    const r = await pool.query('SELECT 1 as ok');
    res.json({ status: 'ok', db: r.rows[0].ok === 1 });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/stats', statsRouter);

// Fallback to index
app.use((req, res, next) => {
  if (req.method.toUpperCase() !== 'GET') return next();
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  return res.status(404).send('Not Found');
});

const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Captive portal listening on http://${host}:${port}`);
});

// Initialize schema asynchronously so static pages serve even if DB is down
ensureSchema().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Schema init error (continuing):', err.message);
});


