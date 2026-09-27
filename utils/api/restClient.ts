import { APIRequestContext } from '@playwright/test';
import { apiBaseURL } from '../helpers';
import { AuthResult } from './auth';
import { buildHeaders } from './graphqlClient';

/**
 * REST helper for the few openIMIS REST endpoints that don't go through
 * the GraphQL schema. Today that's:
 *
 *   - GET  /api/core/users/current_user/   → returns the logged-in user
 *   - POST /api/login                      → handled in `auth.ts`
 *   - GET  /api/core/users/                → paginated users
 *   - POST /api/core/fetch_export?export=… → export download
 *
 * For everything else, use `graphqlClient.ts`.
 */

export interface CurrentUserResponse {
  id: number;
  username: string;
  email: string;
  i_user?: { id: number; uuid: string; code?: string; last_name?: string; other_names?: string };
  rights?: Array<{ right_id: number; description: string }>;
  roles?: Array<{ id: number; name: string }>;
}

/**
 * GET /api/core/users/current_user/ — returns the logged-in user.
 * Confirms the JWT works and gives a quick signal that the demo is up.
 */
export async function fetchCurrentUser(
  ctx: APIRequestContext,
  auth: AuthResult,
): Promise<CurrentUserResponse> {
  const url = `${apiBaseURL()}/core/users/current_user/`;
  const res = await ctx.get(url, {
    headers: buildHeaders(auth, false),
  });
  if (!res.ok()) {
    throw new Error(`fetchCurrentUser failed: ${res.status()} ${res.statusText()}`);
  }
  return (await res.json()) as CurrentUserResponse;
}

/**
 * GET /api/core/users/ — paginated user list via DRF router.
 */
export async function listUsersViaRest(
  ctx: APIRequestContext,
  auth: AuthResult,
  page = 1,
  pageSize = 20,
): Promise<{ count: number; results: Array<Record<string, unknown>> }> {
  const url = `${apiBaseURL()}/core/users/?page=${page}&page_size=${pageSize}`;
  const res = await ctx.get(url, {
    headers: buildHeaders(auth, false),
  });
  if (!res.ok()) {
    throw new Error(`listUsersViaRest failed: ${res.status()} ${res.statusText()}`);
  }
  return (await res.json()) as { count: number; results: Array<Record<string, unknown>> };
}

/**
 * GET /api/core/fetch_export?export=<export_name>
 * Triggers a server-side export (CSV/XLSX) and returns the raw bytes.
 * The full set of available export names depends on which modules are
 * installed; common ones are `claims`, `policies`, `insurees`, `contributions`.
 */
export async function fetchExport(
  ctx: APIRequestContext,
  auth: AuthResult,
  exportName: string,
): Promise<Buffer> {
  const url = `${apiBaseURL()}/core/fetch_export?export=${encodeURIComponent(exportName)}`;
  const res = await ctx.get(url, {
    headers: buildHeaders(auth, false),
  });
  if (!res.ok()) {
    throw new Error(`fetchExport(${exportName}) failed: ${res.status()} ${res.statusText()}`);
  }
  return Buffer.from(await res.body());
}

/**
 * GET /api/ht/  →  health-check endpoint exposed by `health_check.urls`.
 * Returns 200 with a JSON body of subsystem statuses.
 */
export async function pingHealthCheck(ctx: APIRequestContext): Promise<boolean> {
  const url = `${apiBaseURL().replace('/api', '')}/ht/`;
  try {
    const res = await ctx.get(url);
    return res.ok();
  } catch {
    return false;
  }
}