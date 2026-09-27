import { Page, expect, request as playwrightRequest, APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Helpers shared across all three test surfaces (UI, API, DB).
 *
 * The helpers here are deliberately tiny — every one of them has a
 * single reason to be imported and exists only to remove copy-paste
 * between spec files. They never reach into openIMIS specifics; for
 * that, look in `utils/api/*` and `utils/db/*`.
 */

/* ---------------------------------------------------------------------------
 * URL helpers
 * ------------------------------------------------------------------------- */

/** Assert that the current page URL contains the supplied substring (regex). */
export async function expectUrlContains(page: Page, fragment: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(fragment.replace(/\./g, '\\.')));
}

/** Wait for the URL to contain the supplied substring, up to a timeout. */
export async function waitForUrlContains(page: Page, fragment: string, timeoutMs = 15_000): Promise<void> {
  await expect.poll(
    () => new URL(page.url()).pathname + new URL(page.url()).search,
    { timeout: timeoutMs, intervals: [200, 500, 1_000] },
  ).toMatch(new RegExp(fragment.replace(/\./g, '\\.')));
}

/* ---------------------------------------------------------------------------
 * Console error tracking (UI tests)
 * ------------------------------------------------------------------------- */

/**
 * Capture every console message of level "error" so the test can fail on
 * unexpected client-side errors. Returns a sink that the test should pass
 * to `assertNoConsoleErrors` at the end of the case.
 */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
}

/** Fail the test if any unexpected error was logged on the page. */
export async function assertNoConsoleErrors(errors: string[]): Promise<void> {
  // openIMIS frontend occasionally logs third-party noise (e.g. Webpack
  // HMR in dev, browser extension warnings). Keep those but fail on
  // anything from the app's own domain.
  //
  // Known demo noise that's safe to ignore:
  //   - favicon errors (icon not on demo)
  //   - HMR (dev build only)
  //   - websocket reconnects (after session changes)
  //   - service-worker registration (demo serves text/html for service-worker.js)
  //   - 401 Unauthorized (expected before login completes)
  const filtered = errors.filter(
    (e) =>
      !e.toLowerCase().includes('favicon') &&
      !e.toLowerCase().includes('hmr') &&
      !e.toLowerCase().includes('websocket') &&
      !e.toLowerCase().includes('serviceworker') &&
      !e.toLowerCase().includes('service-worker') &&
      !e.toLowerCase().includes('unsupported mime type') &&
      !e.includes('401 (Unauthorized)'),
  );
  expect(filtered, `Unexpected client-side errors:\n${filtered.join('\n')}`).toHaveLength(0);
}

/* ---------------------------------------------------------------------------
 * API helpers (used by API + DB tests)
 * ------------------------------------------------------------------------- */

/** Resolve the configured base API URL (without trailing slash). */
export function apiBaseURL(): string {
  return (process.env.OPENIMIS_API_BASE_URL ?? 'https://demo.openimis.org/api').replace(/\/$/, '');
}

/** Resolve the GraphQL endpoint URL. */
export function graphqlURL(): string {
  return process.env.OPENIMIS_GRAPHQL_URL ?? `${apiBaseURL()}/graphql`;
}

/** Resolve the REST login URL. */
export function loginURL(): string {
  return process.env.OPENIMIS_LOGIN_URL ?? `${apiBaseURL()}/login`;
}

/** Resolve the FHIR base URL. */
export function fhirBaseURL(): string {
  return process.env.OPENIMIS_FHIR_BASE_URL ?? `${apiBaseURL()}/fhir`;
}

/**
 * Decode openIMIS' base64-encoded Relay IDs.
 *   "VXNlclR5cGU6MQ==" → "1"
 *   "SW5zdXJlZVR5cGU6NDI=" → "42"
 * Mirrors `decodeId(id)` in the openIMIS frontend (`openimis-fe-core_js`).
 */
export function decodeId(encoded: string | null | undefined): string | null {
  if (!encoded) return null;
  if (/^\d+$/.test(encoded)) return encoded; // already a raw id
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    return parts.length > 1 ? parts[1] : decoded;
  } catch {
    return null;
  }
}

/**
 * Encode a numeric ID back to the openIMIS Relay format.
 *   encodeId('InsureeGQLType', 42) → base64("InsureeGQLType:42")
 * Use the GraphQL type name as it appears in `__typename`, e.g.
 * `InsureeGQLType`, `PolicyGQLType`, `ClaimGQLType`.
 */
export function encodeId(gqlType: string, id: number | string): string {
  return Buffer.from(`${gqlType}:${id}`, 'utf-8').toString('base64');
}

/* ---------------------------------------------------------------------------
 * Lightweight retry helper
 * ------------------------------------------------------------------------- */

/** Retry an async operation with exponential backoff. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseDelayMs?: number; label?: string } = {},
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 250;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1) break;
      const wait = baseDelayMs * Math.pow(2, i);
      console.warn(
        `[withRetry${opts.label ? ' ' + opts.label : ''}] attempt ${i + 1}/${attempts} failed, retrying in ${wait}ms`,
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/* ---------------------------------------------------------------------------
 * Pagination helpers
 * ------------------------------------------------------------------------- */

/** Build the Relay-style pageInfo extracted from a GraphQL page query. */
export interface RelayPageInfo {
  totalCount?: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

/** Convenience for unpaginating: keep fetching `entity(...)` until no more pages. */
export async function fetchAllEdges<T>(
  ctx: APIRequestContext,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T[]> {
  const out: T[] = [];
  let after: string | null = null;
  // Naive cap to avoid runaway loops in case the server doesn't terminate.
  const MAX_PAGES = 100;
  for (let i = 0; i < MAX_PAGES; i++) {
    const merged = after ? { ...variables, after } : variables;
    const res: APIResponse = await ctx.post('', {
      headers: { 'Content-Type': 'application/json' },
      data: { query, variables: merged },
    });
    const json = await res.json();
    const data = json?.data;
    if (!data) break;
    const firstEntityKey = Object.keys(data)[0];
    const entity = data?.[firstEntityKey];
    const edges = entity?.edges ?? [];
    for (const e of edges) out.push(e.node as T);
    if (!entity?.pageInfo?.hasNextPage) break;
    after = entity.pageInfo.endCursor;
    if (!after) break;
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * Logging
 * ------------------------------------------------------------------------- */

/** Marker used by tests to print a section header during verbose runs. */
export function section(title: string): void {
  console.log(`\n========== ${title} ==========`);
}