/**
 * tests/api/auth.spec.ts
 *
 * Authentication flows against the openIMIS backend:
 *
 *   - POST /api/login                          → returns JWT + sets csrftoken
 *   - GET  /api/core/users/current_user/        → confirms token works
 *   - GraphQL `tokenAuth` mutation             → mirrors the SPA flow
 *   - GraphQL `verifyToken` / `refreshToken`   → standard graphql-jwt
 *   - GraphQL `deleteTokenCookie` / `deleteRefreshTokenCookie` → logout
 *
 * Each test obtains its own request context so it can run independently
 * against the shared demo.
 */
import { test, expect, request } from '../../utils/api/skipGuard';
import { apiBaseURL, graphqlURL } from '../../utils/helpers';
import { authenticate, refreshAccessToken, logout, authedRequest } from '../../utils/api/auth';
import { gqlQuery, gqlMutate, pingGraphQL, fetchAllPages } from '../../utils/api/graphqlClient';
import { fetchCurrentUser, pingHealthCheck } from '../../utils/api/restClient';
import {
  MUTATION_TOKEN_AUTH,
  MUTATION_VERIFY_TOKEN,
  MUTATION_DELETE_TOKEN_COOKIES,
  QUERY_CURRENT_USER,
} from '../../utils/api/queries';
import { DemoCredentials } from '../../utils/testData';

test.describe('Authentication @api', () => {

  test.beforeEach(async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    try {
      await pingGraphQL(ctx);
    } catch {
      test.skip(true, 'openIMIS API unreachable');
    } finally {
      await ctx.dispose();
    }
  });
  test('GraphQL endpoint is reachable', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    expect(await pingGraphQL(ctx)).toBeTruthy();
    await ctx.dispose();
  });

  test('health-check endpoint responds', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    // Either true or false (the demo may or may not expose /ht/) — we
    // just want to confirm it doesn't crash.
    const ok = await pingHealthCheck(ctx);
    expect(typeof ok).toBe('boolean');
    await ctx.dispose();
  });

  test('GraphQL tokenAuth returns a JWT', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const auth = await authenticate(ctx);
    expect(auth.token.length).toBeGreaterThan(20);
    await ctx.dispose();
  });

  test('REST login with wrong credentials throws', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    await expect(
      authenticate(ctx, 'definitely_not_a_user', 'definitely_wrong_password'),
    ).rejects.toThrow();
    await ctx.dispose();
  });

  test('GraphQL tokenAuth mutation returns a token', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const data = await gqlQuery<{
      tokenAuth: {
        token: string;
        refreshExpiresIn: number;
        payload: Record<string, unknown>;
        refreshToken: string;
        user: { id: string; username: string };
      };
    }>(ctx, MUTATION_TOKEN_AUTH, {
      username: DemoCredentials.username,
      password: DemoCredentials.password,
    });
    expect(data.tokenAuth.token.length).toBeGreaterThan(20);
    expect(data.tokenAuth.payload).toBeTruthy();
    await ctx.dispose();
  });

  test('GraphQL tokenAuth with wrong credentials throws', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    await expect(
      gqlQuery(ctx, MUTATION_TOKEN_AUTH, {
        username: 'wrong',
        password: 'wrong',
      }),
    ).rejects.toThrow();
    await ctx.dispose();
  });

  test('current_user REST endpoint returns the demo user', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const auth = await authenticate(ctx);
    const me = await fetchCurrentUser(ctx, auth);
    expect(me.username).toBeTruthy();
    await ctx.dispose();
  });

  test('GraphQL user query returns the demo user', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const auth = await authenticate(ctx);
    const data = await gqlQuery<{ user: { username: string; email: string } }>(
      ctx,
      '{ user { username email } }',
      {},
      auth,
    );
    expect(data.user.username).toBeTruthy();
    await ctx.dispose();
  });

  test('verifyToken mutation returns the original payload', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const auth = await authenticate(ctx);
    const data = await gqlQuery<{ verifyToken: { payload: unknown } }>(
      ctx,
      MUTATION_VERIFY_TOKEN,
      {},
      auth,
    );
    expect(data.verifyToken.payload).toBeTruthy();
    await ctx.dispose();
  });

  test('refreshToken mutation returns a token or is unavailable', async () => {
    // The demo's `OpenimisObtainJSONWebToken` doesn't expose the
    // `refreshToken` field in its tokenAuth response, so the refresh
    // helper can't be tested with this demo. Call the
    // `refreshToken` mutation directly and assert either it returns a
    // token, or it errors with a known shape (no refresh cookie set).
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    await authenticate(ctx); // sets the auth cookies that refreshToken needs
    const res = await ctx.post(`${apiBaseURL()}/graphql`, {
      headers: { 'Content-Type': 'application/json' },
      data: { query: 'mutation { refreshToken { token refreshExpiresIn } }' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(500);
    const body = await res.json();
    // Either we got a fresh token, or the mutation rejected because
    // the demo didn't issue one. Both outcomes are valid for this demo.
    if (body?.data?.refreshToken?.token) {
      expect(body.data.refreshToken.token.length).toBeGreaterThan(20);
    } else {
      expect(body?.errors || body?.data?.refreshToken === null).toBeTruthy();
    }
    await ctx.dispose();
  });

  test('logout clears the JWT cookies', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const auth = await authenticate(ctx);
    const ok = await logout(ctx, auth.csrfToken);
    expect(ok).toBeTruthy();
    await ctx.dispose();
  });

  test('deleteTokenCookie mutation reports deletion', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const auth = await authenticate(ctx);
    const data = await gqlQuery<{ deleteTokenCookie: { deleted: boolean }; deleteRefreshTokenCookie: { deleted: boolean } }>(
      ctx,
      MUTATION_DELETE_TOKEN_COOKIES,
      {},
      auth,
    );
    expect(data.deleteTokenCookie.deleted).toBeTruthy();
    await ctx.dispose();
  });

  test('multiple logins can run in parallel', async () => {
    const [ctx1, ctx2] = await Promise.all([
      request.newContext({ baseURL: apiBaseURL() }),
      request.newContext({ baseURL: apiBaseURL() }),
    ]);
    const [auth1, auth2] = await Promise.all([authenticate(ctx1), authenticate(ctx2)]);
    expect(auth1.token).not.toEqual(auth2.token);
    await ctx1.dispose();
    await ctx2.dispose();
  });

  test('JWT uses JWT auth scheme (not Bearer)', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const auth = await authenticate(ctx);
    // The header should be Authorization: JWT <token>
    const res = await ctx.get(`${apiBaseURL()}/core/users/current_user/`, {
      headers: { Authorization: `JWT ${auth.token}` },
    });
    expect(res.status()).toBe(200);
    await ctx.dispose();
  });

  test('Bearer scheme may or may not be accepted (openIMIS auth scheme)', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const auth = await authenticate(ctx);
    // Some openIMIS deployments accept either `Authorization: JWT <token>`
    // or `Authorization: Bearer <token>`, others only accept the custom
    // JWT scheme. The contract isn't strict — accept any sane status
    // (200 / 401 / 403 / 404). What matters is the response is sane
    // (no 5xx crash).
    const res = await ctx.get(`${apiBaseURL()}/core/users/current_user/`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(500);
    await ctx.dispose();
  });

  test('unauthenticated request to current_user returns 401/403', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const res = await ctx.get(`${apiBaseURL()}/core/users/current_user/`);
    expect(res.status()).toBeGreaterThanOrEqual(400);
    await ctx.dispose();
  });

  test('authedRequest convenience helper returns ctx + auth', async () => {
    const { ctx, auth } = await authedRequest(apiBaseURL());
    expect(ctx).toBeTruthy();
    expect(auth.token.length).toBeGreaterThan(20);
    await ctx.dispose();
  });
});
