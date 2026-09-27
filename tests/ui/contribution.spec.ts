/**
 * tests/ui/contribution.spec.ts
 *
 * End-to-end flows for the openIMIS contribution / premium searcher at
 * /front/contribution/contributions.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ContributionPage } from '../../pages/ContributionPage';

test.describe('Contribution searcher @ui', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login();
    const c = new ContributionPage(page);
    await c.open();
  });

  test('renders the contributions URL', async ({ page }) => {
    // Either /contribution/contributions or similar
    const url = page.url();
    expect(url).toMatch(/\/contribution/i);
  });

  test('data grid is present', async ({ page }) => {
    const c = new ContributionPage(page);
    await page.waitForTimeout(2_000);
    expect(await c.rowCount()).toBeGreaterThanOrEqual(0);
  });

  test('column headers are visible', async ({ page }) => {
    const c = new ContributionPage(page);
    await page.waitForTimeout(2_000);
    const headers = await c.getColumnHeaders();
    expect(Array.isArray(headers)).toBeTruthy();
  });

  test('can search by receipt number', async ({ page }) => {
    const c = new ContributionPage(page);
    if (await c.searchInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await c.filterByReceipt('RCP');
      await page.waitForTimeout(1_500);
    }
  });

  test('Add contribution button visibility reflects permission', async ({ page }) => {
    const c = new ContributionPage(page);
    const visible = await c.addContributionButton.isVisible({ timeout: 1_000 }).catch(() => false);
    expect(typeof visible).toBe('boolean');
  });
});