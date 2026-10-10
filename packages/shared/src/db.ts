import { Pool } from 'pg';
import { DEFAULT_SITE_CONTENT } from './defaults';
import { SiteContent } from './types';

let pool: Pool | null = null;
let initializationPromise: Promise<void> | null = null;

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'CRITICAL CONFIGURATION ERROR: The DATABASE_URL environment variable is missing. ' +
      'In-memory fallbacks are strictly disabled. Please configure a valid Postgres connection string.'
    );
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=require') || connectionString.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

/**
 * Initializes required Postgres tables if not already present.
 */
export function initializeDatabase(): Promise<void> {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const p = getPool();
    const client = await p.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS site_content (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS site_content_history (
          id SERIAL PRIMARY KEY,
          data JSONB NOT NULL,
          saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS rate_limits (
          key TEXT PRIMARY KEY,
          count INTEGER NOT NULL,
          reset_at BIGINT NOT NULL
        );
      `);
      await client.query(
        `
        INSERT INTO site_content (id, data)
        VALUES ($1, $2)
        ON CONFLICT (id) DO NOTHING;
        `,
        ['main', JSON.stringify(DEFAULT_SITE_CONTENT)]
      );
    } finally {
      client.release();
    }
  })().catch((err) => {
    initializationPromise = null;
    throw err;
  });

  return initializationPromise;
}

/**
 * Atomic Serverless Rate Limiter stored in Postgres.
 * Strictly enforced against database table. Zero in-memory fallback.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowSeconds: number = 900 // 15 minutes default
): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number }> {
  await initializeDatabase();
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const p = getPool();

  const client = await p.connect();
  try {
    const res = await client.query(
      'SELECT count, reset_at FROM rate_limits WHERE key = $1',
      [key]
    );

    if (res.rows.length === 0 || Number(res.rows[0].reset_at) <= now) {
      return { allowed: true, remaining: maxAttempts, resetInSeconds: windowSeconds };
    }

    const count = Number(res.rows[0].count);
    const resetInSeconds = Math.max(1, Math.ceil((Number(res.rows[0].reset_at) - now) / 1000));
    const allowed = count < maxAttempts;
    const remaining = Math.max(0, maxAttempts - count);

    return { allowed, remaining, resetInSeconds };
  } finally {
    client.release();
  }
}

export async function recordRateLimitFailure(
  key: string,
  maxAttempts: number = 5,
  windowSeconds: number = 900
): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number }> {
  await initializeDatabase();
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const p = getPool();
  const client = await p.connect();

  try {
    const res = await client.query(
      `
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES ($1, 1, $2)
      ON CONFLICT (key) DO UPDATE
      SET count = CASE
                   WHEN rate_limits.reset_at <= $3 THEN 1
                   ELSE rate_limits.count + 1
                 END,
          reset_at = CASE
                       WHEN rate_limits.reset_at <= $3 THEN $2
                       ELSE rate_limits.reset_at
                     END
      RETURNING count, reset_at;
      `,
      [key, now + windowMs, now]
    );

    const count = Number(res.rows[0].count);
    const resetInSeconds = Math.max(1, Math.ceil((Number(res.rows[0].reset_at) - now) / 1000));

    return {
      allowed: count < maxAttempts,
      remaining: Math.max(0, maxAttempts - count),
      resetInSeconds,
    };
  } finally {
    client.release();
  }
}

/**
 * Reads site content from Postgres.
 */
export async function getSiteContent(): Promise<SiteContent> {
  await initializeDatabase();
  const p = getPool();
  const client = await p.connect();
  try {
    const res = await client.query('SELECT data FROM site_content WHERE id = $1', ['main']);
    if (res.rows.length > 0) {
      return res.rows[0].data as SiteContent;
    }
    throw new Error('Site content is not initialized in the database.');
  } finally {
    client.release();
  }
}

export async function getSiteContentHistory(): Promise<SiteContent[]> {
  await initializeDatabase();
  const p = getPool();
  const client = await p.connect();
  try {
    const res = await client.query(
      'SELECT data FROM site_content_history ORDER BY id DESC'
    );
    return res.rows.map((row) => row.data as SiteContent);
  } finally {
    client.release();
  }
}

/**
 * Saves site content to Postgres and archives previous version to site_content_history for Undo.
 */
export async function saveSiteContent(content: SiteContent): Promise<void> {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');

    // Archive current version into history before overwriting (keep up to 10 versions)
    const current = await client.query('SELECT data FROM site_content WHERE id = $1', ['main']);
    if (current.rows.length > 0) {
      await client.query('INSERT INTO site_content_history (data) VALUES ($1)', [
        JSON.stringify(current.rows[0].data),
      ]);
    }

    // Keep the latest 10 snapshots on every save.
    await client.query(`
      DELETE FROM site_content_history
      WHERE id NOT IN (
        SELECT id FROM site_content_history ORDER BY id DESC LIMIT 10
      )
    `);

    // Upsert new content
    await client.query(
      `
      INSERT INTO site_content (id, data, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (id) DO UPDATE
      SET data = $2, updated_at = NOW();
      `,
      ['main', JSON.stringify(content)]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Restores the previous published version from site_content_history ("Undo Last Publish").
 */
export async function undoLastPublish(): Promise<SiteContent | null> {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');

    // Fetch most recent snapshot
    const historyRes = await client.query(
      'SELECT id, data FROM site_content_history ORDER BY id DESC LIMIT 1'
    );

    if (historyRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const { id, data } = historyRes.rows[0];

    // Restore to main content
    await client.query(
      `
      INSERT INTO site_content (id, data, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (id) DO UPDATE
      SET data = $2, updated_at = NOW();
      `,
      ['main', JSON.stringify(data)]
    );

    // Delete restored entry from history
    await client.query('DELETE FROM site_content_history WHERE id = $1', [id]);

    await client.query('COMMIT');
    return data as SiteContent;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Checks if an undo snapshot is available.
 */
export async function hasUndoHistory(): Promise<boolean> {
  const p = getPool();
  const client = await p.connect();
  try {
    const res = await client.query('SELECT COUNT(*) FROM site_content_history');
    return parseInt(res.rows[0].count, 10) > 0;
  } finally {
    client.release();
  }
}
