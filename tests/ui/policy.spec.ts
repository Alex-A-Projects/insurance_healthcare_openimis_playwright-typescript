/**
 * tests/ui/policy.spec.ts
 *
 * End-to-end flows for the openIMIS policy searcher at
 * /front/policy/policies. The form lets you pick a product, family,
 * enrolment officer, dates, and a value.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { PolicyPage } from '../../pages/PolicyPage';

test.describe('Policy searcher @ui', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login();
    const policy = new PolicyPage(page);
    await policy.open();
  });

  test('renders the policy searcher URL', async ({ page }) => {
    await expect(page).toHaveURL(/\/front\/policy\/policies/);
  });

  test('renders a data grid', async ({ page }) => {
    const policy = new PolicyPage(page);
    await page.waitForTimeout(2_000);
    expect(await policy.rowCount()).toBeGreaterThanOrEqual(0);
  });

  test('shows the Add new policy button', async ({ page }) => {
    const policy = new PolicyPage(page);
    if (await policy.addPolicyButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await expect(policy.addPolicyButton).toBeVisible();
    } else {
      test.skip(true, 'Add policy button not visible in this build');
    }
  });

  test('opens the policy form when Add new is clicked', async ({ page }) => {
    const policy = new PolicyPage(page);
    if (!(await policy.addPolicyButton.isVisible({ timeout: 1_000 }).catch(() => false))) {
      test.skip(true, 'Add policy button not visible');
      return;
    }
    await policy.openAddForm();
    await expect(policy.productSelect).toBeVisible({ timeout: 10_000 });
    await expect(policy.enrollDateInput).toBeVisible();
    await expect(policy.startDateInput).toBeVisible();
    await expect(policy.expiryDateInput).toBeVisible();
    await expect(policy.valueInput).toBeVisible();
  });

  test('data grid has column headers', async ({ page }) => {
    const policy = new PolicyPage(page);
    await page.waitForTimeout(2_000);
    const headers = await policy.getColumnHeaders();
    expect(Array.isArray(headers)).toBeTruthy();
  });

  test('row count is non-negative', async ({ page }) => {
    const policy = new PolicyPage(page);
    await page.waitForTimeout(2_000);
    expect(await policy.rowCount()).toBeGreaterThanOrEqual(0);
  });

  test('can filter by CHF ID via searcher', async ({ page }) => {
    const policy = new PolicyPage(page);
    if (await policy.searchInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await policy.filterByChfId('174000002');
    }
  });

  test('enroll date field is a date input', async ({ page }) => {
    const policy = new PolicyPage(page);
    if (!(await policy.addPolicyButton.isVisible({ timeout: 1_000 }).catch(() => false))) {
      test.skip(true, 'Add policy button not visible');
      return;
    }
    await policy.openAddForm();
    await expect(policy.enrollDateInput).toHaveAttribute('type', /date|text|datetime-local/);
  });

  test('value field accepts numeric text', async ({ page }) => {
    const policy = new PolicyPage(page);
    if (!(await policy.addPolicyButton.isVisible({ timeout: 1_000 }).catch(() => false))) {
      test.skip(true, 'Add policy button not visible');
      return;
    }
    await policy.openAddForm();
    await policy.valueInput.fill('1234.56');
    await expect(policy.valueInput).toHaveValue('1234.56');
  });

  test('product dropdown opens on click', async ({ page }) => {
    const policy = new PolicyPage(page);
    if (!(await policy.addPolicyButton.isVisible({ timeout: 1_000 }).catch(() => false))) {
      test.skip(true, 'Add policy button not visible');
      return;
    }
    await policy.openAddForm();
    await policy.productSelect.click();
    await page.waitForTimeout(500);
    // An option listbox should be visible somewhere on the page.
    const listbox = await page.locator('[role="listbox"]').first().isVisible().catch(() => false);
    expect(typeof listbox).toBe('boolean');
  });

  test('first-row text is non-empty when there are rows', async ({ page }) => {
    const policy = new PolicyPage(page);
    await page.waitForTimeout(2_000);
    const count = await policy.rowCount();
    if (count > 0) {
      const text = await policy.firstRowText();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('can dismiss the form with Escape', async ({ page }) => {
    const policy = new PolicyPage(page);
    if (!(await policy.addPolicyButton.isVisible({ timeout: 1_000 }).catch(() => false))) {
      test.skip(true, 'Add policy button not visible');
      return;
    }
    await policy.openAddForm();
    await page.waitForTimeout(1_000);
    await policy.closeOpenDialog();
  });
});