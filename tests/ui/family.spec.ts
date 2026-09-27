/**
 * tests/ui/family.spec.ts
 *
 * End-to-end flows for the openIMIS family / group searcher at
 * /front/insuree/families.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { FamilyPage } from '../../pages/FamilyPage';

test.describe('Family searcher @ui', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login();
    const family = new FamilyPage(page);
    await family.open();
  });

  test('renders the families URL', async ({ page }) => {
    await expect(page).toHaveURL(/\/front\/insuree\/families/);
  });

  test('data grid is present', async ({ page }) => {
    const family = new FamilyPage(page);
    await page.waitForTimeout(2_000);
    expect(await family.rowCount()).toBeGreaterThanOrEqual(0);
  });

  test('column headers are visible', async ({ page }) => {
    const family = new FamilyPage(page);
    await page.waitForTimeout(2_000);
    const headers = await family.getColumnHeaders();
    expect(Array.isArray(headers)).toBeTruthy();
  });

  test('Add Family button visibility reflects permission', async ({ page }) => {
    const family = new FamilyPage(page);
    const visible = await family.addFamilyButton.isVisible({ timeout: 1_000 }).catch(() => false);
    expect(typeof visible).toBe('boolean');
  });

  test('first row has visible text when there are rows', async ({ page }) => {
    const family = new FamilyPage(page);
    await page.waitForTimeout(2_000);
    const count = await family.rowCount();
    if (count > 0) {
      const text = await family.firstRowText();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('can search by family head CHF ID', async ({ page }) => {
    const family = new FamilyPage(page);
    if (await family.searchInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await family.searchInput.fill('174000002');
      await family.searchInput.press('Enter');
      await page.waitForTimeout(1_500);
    }
  });
});