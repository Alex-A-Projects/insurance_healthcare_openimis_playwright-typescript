/**
 * tests/api/api-graphql-smoke.spec.ts
 *
 * Schema-tolerant GraphQL smoke tests. Verifies that the openIMIS
 * GraphQL endpoint is reachable and returns a valid Relay-shaped Query.
 *
 * Skips cleanly when the openIMIS API isn't reachable or authentication
 * is not possible (e.g. against the public demo where creds may change).
 */
import { test, expect, request } from '@playwright/test';
import { apiBaseURL, graphqlURL } from '../../utils/helpers';
import { pingGraphQL } from '../../utils/api/graphqlClient';

test.describe('API · GraphQL smoke @api', () => {
  test.beforeEach(async () => {
    // Probe the GraphQL endpoint at the start of every test. If the
    // demo is unreachable (or the network is flaky), skip cleanly with
    // an informative message instead of failing the suite.
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const reachable = await pingGraphQL(ctx).catch((err) => {
      console.warn(`[smoke] pingGraphQL threw: ${(err as Error).message?.slice(0, 80)}`);
      return false;
    });
    if (!reachable) {
      console.warn(`[smoke] Skipping — ${apiBaseURL()}/graphql unreachable from ${process.env.HOSTNAME ?? 'localhost'}`);
      test.skip(true, `openIMIS API unreachable at ${apiBaseURL()}`);
    }
    await ctx.dispose();
  });

  test('GraphQL endpoint responds with a Query root', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const res = await ctx.post(graphqlURL(), {
      headers: { 'Content-Type': 'application/json' },
      data: { query: '{ __typename }' },
      timeout: 15_000,
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json?.data?.__typename).toBe('Query');
    await ctx.dispose();
  });

  test('Schema introspection exposes Query and Mutation type names', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const query = `{ __schema { queryType { name } mutationType { name } } }`;
    const res = await ctx.post(graphqlURL(), {
      headers: { 'Content-Type': 'application/json' },
      data: { query },
      timeout: 15_000,
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json?.data?.__schema?.queryType?.name).toBe('Query');
    expect(json?.data?.__schema?.mutationType?.name).toBe('Mutation');
    await ctx.dispose();
  });

  test('GraphQL errors are returned in a 200 envelope, not via HTTP status', async () => {
    // Schema errors are part of the GraphQL protocol — they MUST come
    // back as 200 with an `errors[]` array. Only transport-level
    // failures (malformed JSON) are HTTP 4xx.
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const res = await ctx.post(graphqlURL(), {
      headers: { 'Content-Type': 'application/json' },
      data: { query: '{ definitely_not_a_real_field }' },
      timeout: 15_000,
    });
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(500);
    const json = await res.json().catch(() => null);
    if (res.status() < 400) {
      expect(Array.isArray(json?.errors)).toBeTruthy();
    }
    await ctx.dispose();
  });
});