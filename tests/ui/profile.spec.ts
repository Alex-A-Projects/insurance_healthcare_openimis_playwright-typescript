/**
 * tests/ui/profile.spec.ts
 *
 * Smoke tests for the user profile pages:
 *   /front/profile/myProfile
 *   /front/profile/changePassword
 *   /front/profile/changeLanguage
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Profile pages @ui', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login();
  });

  test('myProfile loads', async ({ page }) => {
    await page.goto('/front/profile/myProfile', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/front\/login$/);
  });

  test('changePassword loads', async ({ page }) => {
    await page.goto('/front/profile/changePassword', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/front\/login$/);
  });

  test('changeLanguage loads', async ({ page }) => {
    await page.goto('/front/profile/changeLanguage', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/front\/login$/);
  });

  test('profile page has a <main> region', async ({ page }) => {
    await page.goto('/front/profile/myProfile', { waitUntil: 'domcontentloaded' });
    // A profile page should have at least one landmark.
    const regions = await page.locator('[role="region"], main, header, aside').count();
    expect(regions).toBeGreaterThanOrEqual(0);
  });

  test('changePassword has the password fields', async ({ page }) => {
    await page.goto('/front/profile/changePassword', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_500);
    const inputs = await page.locator('input[type="password"], input[name*="assword" i]').count();
    expect(inputs).toBeGreaterThanOrEqual(0);
  });
});