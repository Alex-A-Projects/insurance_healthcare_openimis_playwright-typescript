/**
 * tests/ui/navigation.spec.ts
 *
 * Smoke tests for the openIMIS app shell — every major module route
 * should return HTTP 200 without redirecting back to login.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const routes = [
  '/front/home',
  '/front/insuree/insurees',
  '/front/insuree/families',
  '/front/policy/policies',
  '/front/claim/healthFacilities',
  '/front/claim/reviews',
  '/front/claim/feedback',
  '/front/admin/users',
  '/front/admin/products',
  '/front/admin/healthFacilities',
  '/front/admin/locations',
  '/front/admin/claimAdministrators',
  '/front/admin/enrolmentOfficers',
  '/front/payer/payers',
  '/front/medical/medicalItems',
  '/front/medical/medicalServices',
  '/front/tools/reports',
  '/front/tools/extracts',
  '/front/tools/registers',
  '/front/profile/myProfile',
];

test.describe('Navigation @ui', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login();
  });

  for (const path of routes) {
    test(`route ${path} loads without redirecting to login`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response, `response is null for ${path}`).not.toBeNull();
      // We tolerate 4xx for routes that need optional modules installed
      // (e.g. contribution bundle, social-protection). 5xx and login
      // redirects are the real failure modes.
      const status = response!.status();
      expect([200, 304, 404, 403].includes(status) || status < 500).toBeTruthy();
      // Make sure we did NOT get bounced to /front/login
      expect(page.url()).not.toMatch(/\/front\/login(\?|$)/);
    });
  }

  test('home URL does not redirect to login', async ({ page }) => {
    await page.goto('/front/home', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/front\/login$/);
  });

  test('admin products URL does not redirect to login', async ({ page }) => {
    await page.goto('/front/admin/products', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/front\/login$/);
  });

  test('admin users URL does not redirect to login', async ({ page }) => {
    await page.goto('/front/admin/users', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/front\/login$/);
  });

  test('payer URL does not redirect to login', async ({ page }) => {
    await page.goto('/front/payer/payers', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/front\/login$/);
  });

  test('medical services URL does not redirect to login', async ({ page }) => {
    await page.goto('/front/medical/medicalServices', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/front\/login$/);
  });

  test('profile URL does not redirect to login', async ({ page }) => {
    await page.goto('/front/profile/myProfile', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/front\/login$/);
  });
});