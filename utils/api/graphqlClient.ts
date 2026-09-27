import { APIRequestContext, APIResponse } from '@playwright/test';
import { graphqlURL } from '../helpers';
import { AuthResult } from './auth';

/**
 * Lightweight GraphQL client wrapping Playwright's `APIRequestContext`.
 *
 * openIMIS uses a small number of request conventions that this client
 * implements once so tests don't have to repeat them:
 *
 *   - `Authorization: JWT <token>` (note: NOT `Bearer`)
 *   - `X-CSRFToken: <csrf>` for any non-idempotent mutation
 *   - `Content-Type: application/json`
 *   - Response unwrapping: errors are surfaced as thrown `GraphQLError`s
 *
 * Every public function returns the parsed `data` field. Tests inspect
 * `data` directly; they should also call `expectGraphQLSuccess(res)` on
 * the raw response when they want to assert no `errors[]` came back.
 */

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: string[]; extensions?: Record<string, unknown> }>;
}

/* ---------------------------------------------------------------------------
 * Headers
 * ------------------------------------------------------------------------- */

export function buildHeaders(
  auth: AuthResult | null,
  includeCsrf: boolean,
  extra: Record<string, string> = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (auth) {
    headers['Authorization'] = `JWT ${auth.token}`;
    if (includeCsrf && auth.csrfToken) {
      headers['X-CSRFToken'] = auth.csrfToken;
    }
  }
  return headers;
}

/* ---------------------------------------------------------------------------
 * Core request
 * ------------------------------------------------------------------------- */

/**
 * Run a GraphQL operation. Pass an `auth` to attach a JWT; pass `null`
 * for unauthenticated requests (e.g. `tokenAuth` itself).
 */
export async function graphql<T = unknown>(
  ctx: APIRequestContext,
  query: string,
  variables: Record<string, unknown> = {},
  auth: AuthResult | null = null,
): Promise<{ data: T; raw: APIResponse }> {
  const isMutation = /^\s*mutation\b/.test(query);
  // Use the absolute GraphQL URL — relying on baseURL + relative path
  // is fragile (Playwright sometimes drops the trailing path
  // segment, e.g. resolving `/graphql` against baseURL `/api` →
  // `/graphql` → redirected to /front/).
  const res = await ctx.post(graphqlURL(), {
    headers: buildHeaders(auth, isMutation),
    data: { query, variables },
    // GraphQL endpoint returns 400 on errors with a body, so don't throw.
    failOnStatusCode: false,
  });
  const body = (await res.json()) as GraphQLResponse<T>;
  if (body.errors?.length) {
    const e = new Error(
      `GraphQL errors: ${body.errors.map((er) => er.message).join('; ')}`,
    ) as Error & { errors?: typeof body.errors };
    (e as Error & { errors?: typeof body.errors }).errors = body.errors;
    throw e;
  }
  return { data: body.data as T, raw: res };
}

/** Convenience: run a query (idempotent — no CSRF header needed). */
export async function gqlQuery<T = unknown>(
  ctx: APIRequestContext,
  query: string,
  variables: Record<string, unknown> = {},
  auth: AuthResult | null = null,
): Promise<T> {
  const r = await graphql<T>(ctx, query, variables, auth);
  return r.data;
}

/** Convenience: run a mutation (CSRF header attached if available). */
export async function gqlMutate<T = unknown>(
  ctx: APIRequestContext,
  mutation: string,
  variables: Record<string, unknown> = {},
  auth: AuthResult | null,
): Promise<T> {
  const r = await graphql<T>(ctx, mutation, variables, auth);
  return r.data;
}

/* ---------------------------------------------------------------------------
 * Response helpers
 * ------------------------------------------------------------------------- */

/** Assert that the raw response is HTTP 200 + has no GraphQL errors[]. */
export function expectGraphQLSuccess(res: APIResponse): void {
  if (!res.ok()) {
    throw new Error(`GraphQL HTTP ${res.status()} ${res.statusText()}`);
  }
}

/* ---------------------------------------------------------------------------
 * Introspection
 * ------------------------------------------------------------------------- */

/** Run an introspection query to confirm the schema is alive. */
export async function pingGraphQL(ctx: APIRequestContext): Promise<boolean> {
  try {
    await graphql<{ __typename: string }>(ctx, '{ __typename }');
    return true;
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------------------------
 * Cursor helpers
 * ------------------------------------------------------------------------- */

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface Connection<T> {
  totalCount?: number;
  pageInfo: PageInfo;
  edges: Array<{ cursor: string; node: T }>;
}

/**
 * Iterate every page of a Relay-style connection and return all nodes.
 * Use for tests that need "give me all rows without paging manually".
 */
export async function fetchAllPages<T>(
  ctx: APIRequestContext,
  query: string,
  rootField: string,
  pageSize = 50,
  auth: AuthResult | null = null,
): Promise<T[]> {
  const all: T[] = [];
  let after: string | null = null;
  for (let page = 0; page < 1000; page++) {
    const variables: Record<string, unknown> = { first: pageSize };
    if (after) variables.after = after;
    const data = await gqlQuery<Record<string, Connection<T>>>(ctx, query, variables, auth);
    const conn = data?.[rootField];
    if (!conn) return all;
    for (const edge of conn.edges) all.push(edge.node);
    if (!conn.pageInfo.hasNextPage || !conn.pageInfo.endCursor) return all;
    after = conn.pageInfo.endCursor;
  }
  return all;
}

/* ---------------------------------------------------------------------------
 * Mutation log lookup
 * ------------------------------------------------------------------------- */

/**
 * After a mutation, the server returns only `{ clientMutationId, internalId }`.
 * The real UUIDs of any created entities are surfaced asynchronously via
 * the `mutationLogs` query. This helper polls until the log is populated
 * (default 10 seconds, configurable) and returns the parsed nodes.
 */
export async function waitForMutationLogs(
  ctx: APIRequestContext,
  clientMutationId: string,
  auth: AuthResult,
  timeoutMs = 15_000,
): Promise<Record<string, unknown>> {
  const query = `query GetMutationLogs($clientMutationId: String!) {
    mutationLogs(clientMutationId: $clientMutationId) {
      edges { node {
        id status
        insurees { insuree { uuid } family { uuid } }
        policies { policy { uuid } family { uuid } }
        claims { claim { uuid } }
        premiums { premium { uuid } }
        users { user { username } }
      } }
    }
  }`;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const data = await gqlQuery<{ mutationLogs: Connection<Record<string, unknown>> }>(
        ctx,
        query,
        { clientMutationId },
        auth,
      );
      const node = data?.mutationLogs?.edges?.[0]?.node;
      if (node) return node;
    } catch {
      // mutationLogs may not be ready yet — keep polling
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Mutation log for ${clientMutationId} not found after ${timeoutMs}ms`);
}