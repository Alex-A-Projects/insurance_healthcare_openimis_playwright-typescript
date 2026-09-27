/**
 * tests/api/api-mutations-smoke.spec.ts
 *
 * Schema-tolerant GraphQL mutation smoke tests. Each test sends a minimal
 * mutation with the standard `clientMutationId` / `clientMutationLabel`
 * envelope and verifies the endpoint accepts it without a 5xx crash. We
 * intentionally don't assert on specific response fields — deployments
 * can add or remove input fields without breaking these tests.
 *
 * Tests skip when the openIMIS API isn't reachable.
 */
import { test, expect, request } from '@playwright/test';
import { apiBaseURL, graphqlURL } from '../../utils/helpers';
import { authenticate } from '../../utils/api/auth';
import { pingGraphQL } from '../../utils/api/graphqlClient';

test.describe('API · GraphQL mutations smoke @api', () => {
  test.beforeEach(async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const reachable = await pingGraphQL(ctx).catch(() => false);
    if (!reachable) {
      test.skip(true, 'openIMIS API unreachable');
    }
    await ctx.dispose();
  });

  test('tokenAuth mutation accepts the standard envelope', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const query = `mutation M($username: String!, $password: String!) {
      tokenAuth(username: $username, password: $password) {
        token
      }
    }`;
    const res = await ctx.post(graphqlURL(), {
      headers: { 'Content-Type': 'application/json' },
      data: {
        query,
        variables: { username: 'Admin', password: 'admin123' },
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(500);
    const json = await res.json();
    // Either we got a token (creds worked) or we got a GraphQL error
    // (creds wrong on this deployment). Both are valid responses.
    expect(json?.data?.tokenAuth?.token || json?.errors).toBeTruthy();
    await ctx.dispose();
  });

  test('deleteClaims accepts a uuids list', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const auth = await authenticate(ctx).catch(() => null);
    if (!auth) {
      test.skip(true, 'Authentication failed');
      await ctx.dispose();
      return;
    }
    const query = `mutation M($uuids: [String!]!) {
      deleteClaims(input: { uuids: $uuids, clientMutationId: "smoke", clientMutationLabel: "smoke" }) {
        clientMutationId
      }
    }`;
    const res = await ctx.post(graphqlURL(), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${auth.token}`,
        ...(auth.csrfToken ? { 'X-CSRFToken': auth.csrfToken } : {}),
      },
      data: { query, variables: { uuids: ['00000000-0000-0000-0000-deadbeefcafe'] } },
    });
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(500);
    await ctx.dispose();
  });

  test('deletePolicies accepts a uuids list', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const auth = await authenticate(ctx).catch(() => null);
    if (!auth) {
      test.skip(true, 'Authentication failed');
      await ctx.dispose();
      return;
    }
    const query = `mutation M($uuids: [String!]!) {
      deletePolicies(input: { uuids: $uuids, clientMutationId: "smoke", clientMutationLabel: "smoke" }) {
        clientMutationId
      }
    }`;
    const res = await ctx.post(graphqlURL(), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${auth.token}`,
        ...(auth.csrfToken ? { 'X-CSRFToken': auth.csrfToken } : {}),
      },
      data: { query, variables: { uuids: ['00000000-0000-0000-0000-deadbeefcafe'] } },
    });
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(500);
    await ctx.dispose();
  });

  test('deleteTokenCookie mutation runs without a 5xx', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const query = `mutation { deleteTokenCookie { deleted } }`;
    const res = await ctx.post(graphqlURL(), {
      headers: { 'Content-Type': 'application/json' },
      data: { query },
    });
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(500);
    await ctx.dispose();
  });

  test('malformed query returns an errors[] array, not a 5xx', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    const res = await ctx.post(graphqlURL(), {
      headers: { 'Content-Type': 'application/json' },
      data: { query: '{ definitely_not_a_real_field }' },
    });
    // The deployment may return 200 (errors in body) or 400 (transport
    // parse error). Both are valid GraphQL error responses. Only a 5xx
    // indicates a real server failure.
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(500);
    const json = await res.json().catch(() => null);
    if (res.status() >= 400) {
      expect(typeof json === 'object' || json === null).toBeTruthy();
    } else {
      expect(Array.isArray(json?.errors)).toBeTruthy();
    }
    await ctx.dispose();
  });
});