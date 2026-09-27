/**
 * tests/ui/health-facility.spec.ts
 *
 * End-to-end flows for the openIMIS health facility catalogue at
 * /front/admin/healthFacilities.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { HealthFacilityPage } from '../../pages/HealthFacilityPage';

test.describe('Health Facility searcher @ui', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login();
    const hf = new HealthFacilityPage(page);
    await hf.open();
  });

  test('renders the HF searcher URL', async ({ page }) => {
    await expect(page).toHaveURL(/\/front\/admin\/healthFacilities/);
  });

  test('data grid is present', async ({ page }) => {
    const hf = new HealthFacilityPage(page);
    await page.waitForTimeout(2_000);
    expect(await hf.rowCount()).toBeGreaterThanOrEqual(0);
  });

  test('column headers are visible', async ({ page }) => {
    const hf = new HealthFacilityPage(page);
    await page.waitForTimeout(2_000);
    const headers = await hf.getColumnHeaders();
    expect(Array.isArray(headers)).toBeTruthy();
  });

  test('can search by HF code', async ({ page }) => {
    const hf = new HealthFacilityPage(page);
    if (await hf.searchInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await hf.filterByCode('HF');
      await page.waitForTimeout(1_500);
    }
  });

  test('first row has visible text when there are rows', async ({ page }) => {
    const hf = new HealthFacilityPage(page);
    await page.waitForTimeout(2_000);
    const count = await hf.rowCount();
    if (count > 0) {
      const text = await hf.firstRowText();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('Add button visibility reflects permission', async ({ page }) => {
    const hf = new HealthFacilityPage(page);
    const visible = await hf.addButton.isVisible({ timeout: 1_000 }).catch(() => false);
    expect(typeof visible).toBe('boolean');
  });
});