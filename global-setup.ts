import { request, FullConfig } from '@playwright/test';

/**
 * Global setup - runs once before any test.
 *
 * Validates that the demo openIMIS frontend and GraphQL endpoints are
 * reachable. We do NOT capture a token here because openIMIS uses short-
 * lived JWTs (default 4 hours for the access token) and tests should
 * request their own via the GraphQL `tokenAuth` mutation / `POST /api/login`.
 *
 * The check is informational: a failure prints a warning but does not
 * abort the run, so offline development (UI editing, codegen, etc.)
 * remains possible.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = process.env.OPENIMIS_BASE_URL ?? 'https://demo.openimis.org';
  const apiBase = process.env.OPENIMIS_API_BASE_URL ?? `${baseURL}/api`;

  console.log(`[setup] openIMIS frontend: ${baseURL}`);
  console.log(`[setup] openIMIS API base : ${apiBase}`);

  const ctx = await request.newContext({ baseURL: apiBase });

  // 1) Frontend reachable?
  try {
    const res = await ctx.fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { query: '{ __typename }' },
    });
    if (!res.ok()) {
      console.warn(
        `[setup] GraphQL endpoint returned ${res.status()} - tests will run against the configured URL anyway`,
      );
    } else {
      console.log('[setup] GraphQL /api/graphql is reachable.');
    }
  } catch (e) {
    console.warn(`[setup] Could not reach GraphQL endpoint: ${(e as Error).message}`);
  }

  await ctx.dispose();
}