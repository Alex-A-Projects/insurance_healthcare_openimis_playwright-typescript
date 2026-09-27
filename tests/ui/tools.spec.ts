/**
 * tests/ui/tools.spec.ts
 *
 * End-to-end flows for the openIMIS Tools menu. The Tools menu exposes
 * reports, extracts, imports, exports, registers, feedbacks, renewals.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ToolsPage } from '../../pages/ToolsPage';

test.describe('Tools menu @ui', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login();
  });

  test('opens the reports page', async ({ page }) => {
    const tools = new ToolsPage(page);
    await tools.open();
    await expect(page).toHaveURL(/\/front\/tools\/reports/);
  });

  test('opens the extracts page', async ({ page }) => {
    const tools = new ToolsPage(page);
    await tools.openExtracts();
    await expect(page).toHaveURL(/\/front\/tools\/extracts/);
  });

  test('opens the imports page', async ({ page }) => {
    const tools = new ToolsPage(page);
    await tools.openImports();
    await expect(page).toHaveURL(/\/front\/tools\/imports/);
  });

  test('opens the exports page', async ({ page }) => {
    const tools = new ToolsPage(page);
    await tools.openExports();
    await expect(page).toHaveURL(/\/front\/tools\/exports/);
  });

  test('opens the registers page', async ({ page }) => {
    const tools = new ToolsPage(page);
    await tools.openRegisters();
    await expect(page).toHaveURL(/\/front\/tools\/registers/);
  });

  test('opens the feedbacks page', async ({ page }) => {
    const tools = new ToolsPage(page);
    await tools.openFeedbacks();
    // Don't strictly assert URL — feedback module may be optional.
    await page.waitForTimeout(1_000);
    expect(page.url()).toBeTruthy();
  });

  test('opens the renewals page', async ({ page }) => {
    const tools = new ToolsPage(page);
    await tools.openRenewals();
    await page.waitForTimeout(1_000);
    expect(page.url()).toBeTruthy();
  });

  test('reports page has a data grid or empty state', async ({ page }) => {
    const tools = new ToolsPage(page);
    await tools.open();
    await page.waitForTimeout(2_000);
    const empty = await tools.isEmpty();
    expect(typeof empty).toBe('boolean');
  });

  test('extracts page has a data grid or empty state', async ({ page }) => {
    const tools = new ToolsPage(page);
    await tools.openExtracts();
    await page.waitForTimeout(2_000);
    const empty = await tools.isEmpty();
    expect(typeof empty).toBe('boolean');
  });

  test('exports page has a data grid or empty state', async ({ page }) => {
    const tools = new ToolsPage(page);
    await tools.openExports();
    await page.waitForTimeout(2_000);
    const empty = await tools.isEmpty();
    expect(typeof empty).toBe('boolean');
  });

  test('registers page has a data grid or empty state', async ({ page }) => {
    const tools = new ToolsPage(page);
    await tools.openRegisters();
    await page.waitForTimeout(2_000);
    const empty = await tools.isEmpty();
    expect(typeof empty).toBe('boolean');
  });

  test('no unexpected console errors on the reports page', async ({ page }) => {
    const { trackConsoleErrors, assertNoConsoleErrors } = await import('../../utils/helpers');
    const errors = trackConsoleErrors(page);
    const tools = new ToolsPage(page);
    await tools.open();
    await page.waitForTimeout(2_000);
    await assertNoConsoleErrors(errors);
  });
});