// Railway Postgres: one pool for the whole server, and the schema applied at start.
import {readFile} from 'node:fs/promises';
import pg from 'pg';

const url = process.env.DATABASE_URL;
// Railway's private network needs no TLS; a public URL (e.g. for scripts) does.
export const pool = url ? new pg.Pool({connectionString: url, max: 10, ssl: /\.railway\.internal|localhost|127\.0\.0\.1/.test(url) ? false : {rejectUnauthorized: false}}) : null;

export async function migrate(db = pool) {
  if (!db) return false;
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await db.query(sql);
  return true;
}

/** Runs `work` inside one transaction and returns its result. */
export async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
