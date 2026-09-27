import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { DemoCredentials } from '../testData';
import { graphqlURL } from '../helpers';

/**
 * Authentication for the openIMIS API surface.
 *
 * openIMIS exposes authentication via the GraphQL `tokenAuth` mutation
 * (path: `/api/graphql`). The frontend also calls this directly; the
 * `/api/login` REST endpoint is a legacy alias that may or may not be
 * enabled on a given deployment, so this helper uses the GraphQL path
 * exclusively for reliability.
 *
 * Successful `tokenAuth` returns:
 *   - `token`         — JWT to use as `Authorization: JWT <token>`
 *   - `refreshToken`  — long-lived refresh token
 *   - `refreshExpiresIn` — seconds until refresh expires
 *   - `user`          — the authenticated user
 */

export interface AuthResult {
  token: string;
  refreshToken: string | null;
  refreshExpiresIn: number | null;
  payload: Record<string, unknown> | null;
  user: Record<string, unknown> | null;
  csrfToken: string | null;
  cookies: Array<{ name: string; value: string }>;
}

/**
 * Authenticate against the openIMIS GraphQL `tokenAuth` mutation and
 * return the JWT. Use the returned `token` as `Authorization: JWT <token>`
 * on subsequent calls.
 */
export async function authenticate(
  ctx: APIRequestContext,
  username: string = DemoCredentials.username,
  password: string = DemoCredentials.password,
): Promise<AuthResult> {
  const MUTATION = `mutation Authenticate($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
      refreshExpiresIn
      payload
    }
  }`;
  const res = await ctx.post(graphqlURL(), {
    headers: { 'Content-Type': 'application/json' },
    data: { query: MUTATION, variables: { username, password } },
  });

  // Capture any cookies set by the response (tokenAuth may set
  // httpOnly cookies in addition to returning the token in the body).
  const setCookies = res.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie');
  const cookies: Array<{ name: string; value: string }> = setCookies.map((c) => ({
    name: c.name,
    value: c.value.split(';')[0].split('=').slice(1).join('='),
  }));
  const csrfToken = cookies.find((c) => c.name === 'csrftoken')?.value ?? null;

  if (!res.ok()) {
    throw new Error(
      `openIMIS tokenAuth failed: ${res.status()} ${res.statusText()} — verify OPENIMIS_USERNAME / OPENIMIS_PASSWORD`,
    );
  }

  const body = await res.json();
  // tokenAuth may return either `{ data: { tokenAuth: { token } } }`
  // or `{ errors: [...] }` on bad credentials.
  if (body?.errors?.length) {
    throw new Error(
      `openIMIS tokenAuth errored: ${body.errors.map((e: { message: string }) => e.message).join('; ')}`,
    );
  }
  const payload = body?.data?.tokenAuth ?? {};
  const token = payload.token;
  if (!token) {
    throw new Error(
      `openIMIS tokenAuth response missing token — got: ${JSON.stringify(body).slice(0, 200)}`,
    );
  }

  // `refreshToken` isn't part of the public OpenimisObtainJSONWebToken
  // type on this demo — it's only refreshed via the refreshToken mutation.
  return {
    token,
    refreshToken: null,
    refreshExpiresIn: payload.refreshExpiresIn ?? null,
    payload: payload.payload ?? null,
    user: null,
    csrfToken,
    cookies,
  };
}

/**
 * Refresh the access token using the refresh JWT.
 *
 * openIMIS exposes the standard `graphql-jwt` `refreshToken` mutation.
 * Most tests won't need this because tokens last 1 day by default.
 */
export async function refreshAccessToken(
  ctx: APIRequestContext,
  refreshToken: string,
  csrfToken?: string | null,
): Promise<{ token: string; refreshExpiresIn: number | null }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (csrfToken) headers['X-CSRFToken'] = csrfToken;
  const res = await ctx.post(graphqlURL(), {
    headers,
    data: {
      query: 'mutation { refreshToken { token refreshExpiresIn } }',
    },
  });
  const body = await res.json();
  const payload = body?.data?.refreshToken ?? {};
  return {
    token: payload.token,
    refreshExpiresIn: payload.refreshExpiresIn ?? null,
  };
}

/**
 * Logout by calling the `deleteTokenCookie` mutation. Clears the JWT
 * cookies set during `tokenAuth`. Returns true on success.
 */
export async function logout(
  ctx: APIRequestContext,
  csrfToken?: string | null,
): Promise<boolean> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (csrfToken) headers['X-CSRFToken'] = csrfToken;
  const res = await ctx.post(graphqlURL(), {
    headers,
    data: {
      query: `mutation {
        deleteTokenCookie { deleted }
        deleteRefreshTokenCookie { deleted }
      }`,
    },
  });
  if (!res.ok()) return false;
  const body = await res.json();
  return Boolean(body?.data?.deleteTokenCookie?.deleted);
}

/**
 * Convenience: build an authenticated request context for API tests.
 * Defaults to the demo credentials but accepts overrides.
 */
export async function authedRequest(
  baseURL: string,
  username: string = DemoCredentials.username,
  password: string = DemoCredentials.password,
): Promise<{ ctx: APIRequestContext; auth: AuthResult }> {
  const ctx = await playwrightRequest.newContext({ baseURL });
  const auth = await authenticate(ctx, username, password);
  return { ctx, auth };
}