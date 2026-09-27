import { Pool, PoolClient, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * PostgreSQL connection pool for the openIMIS demo database.
 *
 * openIMIS' backend is Django on PostgreSQL. The default schema uses the
 * `tbl*` prefix convention (e.g. `tblInsuree`, `tblPolicy`, `tblClaim`).
 * Validation/audit/history tables share the prefix and add a suffix
 * (`*Audit`, `*ValidityFrom`, etc.).
 *
 * This module exposes a singleton `Pool` plus a few helpers:
 *
 *   - `query(text, params)` — for ad-hoc queries
 *   - `withTransaction(fn)` — atomic block
 *   - `exists(sql, params)` — boolean check
 *   - `close()` — close the pool on shutdown
 *
 * The `dbAssertions.ts` module next door wraps these helpers with the
 * strongly-typed entity queries (`getInsureeByChfId`, `countClaims`,
 * etc.).
 */

/* ---------------------------------------------------------------------------
 * Configuration
 * ------------------------------------------------------------------------- */

// openIMIS' official demo Docker images use `IMISuser` / `test_imis` as
// the default DB name. Override via .env when pointing at a local install.
const config: PoolConfig = {
  host: process.env.PG_HOST ?? 'localhost',
  port: Number(process.env.PG_PORT ?? 5432),
  database: process.env.PG_DATABASE ?? 'test_imis',
  user: process.env.PG_USER ?? 'IMISuser',
  password: process.env.PG_PASSWORD ?? 'IMISuser@1234',
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
};

let _pool: Pool | null = null;

/** Lazy singleton. The pool is created on first access. */
export function pool(): Pool {
  if (!_pool) {
    _pool = new Pool(config);
    _pool.on('error', (err) => {
      console.warn('[pg] idle client error:', err.message);
    });
  }
  return _pool;
}

/** Close the pool. Safe to call multiple times. */
export async function close(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

/* ---------------------------------------------------------------------------
 * Core helpers
 * ------------------------------------------------------------------------- */

export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool().query<T>(text, params as unknown[]);
  return res.rows;
}

export async function queryOne<T extends object = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function exists(text: string, params: unknown[] = []): Promise<boolean> {
  const res = await pool().query<{ exists: boolean }>(text, params as unknown[]);
  return Boolean(res.rows[0]?.exists);
}

/** True if a table exists in the current schema (regardless of rows). */
export async function tableExists(table: string): Promise<boolean> {
  const res = await pool().query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [table],
  );
  return Boolean(res.rows[0]?.exists);
}

export async function countRows(text: string, params: unknown[] = []): Promise<number> {
  const res = await pool().query<{ c: string | number }>(text, params as unknown[]);
  const c = res.rows[0]?.c;
  return typeof c === 'string' ? Number(c) : c ?? 0;
}

/* ---------------------------------------------------------------------------
 * Transaction wrapper
 * ------------------------------------------------------------------------- */

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

/* ---------------------------------------------------------------------------
 * Smoke checks
 * ------------------------------------------------------------------------- */

/**
 * Verify the demo database is reachable. Logs a warning on failure so
 * CI runs that don't have DB credentials still proceed with the UI/API
 * suites without aborting the whole run.
 */
export async function pingDb(): Promise<boolean> {
  try {
    const res = await pool().query<{ ok: number }>('SELECT 1 AS ok');
    return res.rows[0]?.ok === 1;
  } catch (err) {
    console.warn(`[pg] ping failed: ${(err as Error).message}`);
    return false;
  }
}

/**
 * Print summary statistics so the test report shows the size of the demo
 * dataset. Useful for understanding CI flakiness — a fresh demo will have
 * very small counts and some assertions need minimum seed data.
 */
export async function datasetSummary(): Promise<Record<string, number>> {
  const summary: Record<string, number> = {};
  const tables = [
    'tblInsuree',
    'tblFamilies',
    'tblInsureePolicy',
    'tblPolicy',
    'tblPolicyRenewals',
    'tblPremium',
    'tblProduct',
    'tblProductItems',
    'tblProductServices',
    'tblClaim',
    'tblClaimItems',
    'tblClaimServices',
    'tblClaimDedRem',
    'tblHF',
    'tblHFCatchment',
    'tblLocations',
    'tblUsers',
    'tblOfficer',
    'tblClaimAdmin',
    'tblRole',
    'tblUserRole',
    'tblPayer',
    'tblFeedback',
    'tblICDCodes',
    'tblItems',
    'tblServices',
    'tblPhotos',
    'tblLegalForms',
    'tblHFSublevel',
    'tblUsersDistricts',
    'tblOfficerVillages',
    'tblGender',
    'tblRelations',
    'tblEducations',
    'tblProfessions',
    'core_User',
    'core_TechnicalUser',
    'core_Mutation_Log',
  ];
  for (const t of tables) {
    try {
      const c = await countRows(`SELECT COUNT(*)::int AS c FROM "${t}"`);
      summary[t] = c;
    } catch {
      // Table doesn't exist in this schema — skip silently.
    }
  }
  return summary;
}