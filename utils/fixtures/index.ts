import { test as base, Page, BrowserContext, APIRequestContext } from '@playwright/test';
import { LoginPage } from '../../pages';
import { authenticate, AuthResult } from '../api/auth';
import { apiBaseURL } from '../helpers';

/**
 * Custom Playwright fixtures that share expensive setup across tests.
 *
 * Each fixture receives the underlying Playwright primitives and exposes
 * helpers on top. Use them with the merged `test` below.
 *
 *   - `loginPage` — a fresh LoginPage
 *   - `authedPage` — a Page that's already logged in
 *   - `authedContext` — a BrowserContext that's already logged in
 *   - `api` — a fresh APIRequestContext
 *   - `auth` — an authenticated AuthResult for API calls
 *   - `authedApi` — both ctx and auth in one object
 */

type Fixtures = {
  loginPage: LoginPage;
  authedPage: Page;
  authedContext: BrowserContext;
  api: APIRequestContext;
  auth: AuthResult;
  authedApi: { ctx: APIRequestContext; auth: AuthResult };
};

/**
 * Override the default `test` and `expect` fixtures with our own.
 * Tests import `test, expect` from this module:
 *
 *   import { test, expect } from '../../utils/fixtures';
 */
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  authedPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login();
    await use(page);
  },

  authedContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const login = new LoginPage(page);
    await login.open();
    await login.login();
    await use(context);
    await context.close();
  },

  api: async ({}, use) => {
    const { request } = await import('@playwright/test');
    const ctx = await request.newContext({ baseURL: apiBaseURL() });
    await use(ctx);
    await ctx.dispose();
  },

  auth: async ({ api }, use) => {
    const auth = await authenticate(api);
    await use(auth);
  },

  authedApi: async ({ api, auth }, use) => {
    await use({ ctx: api, auth });
  },
});

export const expect = base.expect;
export { base };
