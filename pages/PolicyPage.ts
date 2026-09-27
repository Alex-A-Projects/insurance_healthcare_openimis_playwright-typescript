import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { PolicyInput, generatePolicy } from '../utils/testData';

/**
 * PolicyPage - the openIMIS policy searcher + form.
 *
 * Routes:
 *   - /front/policy/policies         → searcher / list
 *   - /front/policy/policy           → add / edit form
 *
 * The form lets you pick a product, a family (head-insuree), an enrolment
 * officer, and set dates / value. After save, the policy appears in the
 * searcher with status IDLE (1) until manually activated or linked to a
 * payment.
 */
export class PolicyPage extends BasePage {
  readonly addPolicyButton: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  // Form fields
  readonly productSelect: Locator;
  readonly familySelect: Locator;
  readonly officerSelect: Locator;
  readonly enrollDateInput: Locator;
  readonly startDateInput: Locator;
  readonly expiryDateInput: Locator;
  readonly valueInput: Locator;
  readonly isPaidCheckbox: Locator;
  readonly receiptInput: Locator;

  constructor(page: Page) {
    super(page);
    this.addPolicyButton = page.locator('button:has-text("Add new"), a:has-text("Add new"), button:has-text("Add policy")').first();
    this.searchInput = page.locator('input[placeholder*="search" i], input[name="search"]').first();
    this.searchButton = page.locator('button:has-text("Search"), button[aria-label*="search" i]').first();

    this.productSelect = page.locator('div:has(> label:has-text("Product")) [role="combobox"]').first();
    this.familySelect = page.locator('div:has(> label:has-text("Family")) [role="combobox"]').first();
    this.officerSelect = page.locator('div:has(> label:has-text("Officer")) [role="combobox"]').first();
    this.enrollDateInput = page.locator('input[name="enrollDate"]').first();
    this.startDateInput = page.locator('input[name="startDate"]').first();
    this.expiryDateInput = page.locator('input[name="expiryDate"]').first();
    this.valueInput = page.locator('input[name="value"]').first();
    this.isPaidCheckbox = page.locator('input[type="checkbox"][name="isPaid"]').first();
    this.receiptInput = page.locator('input[name="receipt"]').first();
  }

  /** Open the policy searcher. */
  async open(): Promise<void> {
    await this.goto('/policy/policies');
  }

  /** Open the add-policy form. */
  async openAddForm(): Promise<void> {
    await this.open();
    await this.addPolicyButton.waitFor({ state: 'visible', timeout: 15_000 });
    await this.addPolicyButton.click();
    await this.waitForAppIdle();
  }

  /** Pick a value from a MUI Select dropdown by label text. */
  async pickSelect(selectLocator: Locator, label: string): Promise<void> {
    await selectLocator.click();
    await this.page.locator(`[role="option"]:has-text("${label}"), li:has-text("${label}")`).first().click();
  }

  /** Fill the policy form. */
  async fillPolicyForm(input: PolicyInput): Promise<void> {
    // MUI Select opens a listbox — click then click the matching option.
    await this.productSelect.click();
    await this.page.locator(`[role="option"]:has-text("${input.productCode}"), li:has-text("${input.productCode}")`).first().click();
    await this.familySelect.click();
    await this.page.locator(`[role="option"]`).first().click();
    await this.officerSelect.click();
    await this.page.locator(`[role="option"]`).first().click();
    await this.enrollDateInput.fill(input.enrollDate);
    await this.startDateInput.fill(input.startDate);
    await this.expiryDateInput.fill(input.expiryDate);
    await this.valueInput.fill(input.value);
  }

  /** Submit the form and wait for navigation back to the list. */
  async submitForm(): Promise<void> {
    await Promise.all([
      this.page.waitForURL((u) => !u.pathname.endsWith('/policy') && !u.pathname.endsWith('/policy/'), { timeout: 30_000 }).catch(() => undefined),
      this.submitButton.click(),
    ]);
    await this.waitForAppIdle();
  }

  /** Convenience: open form, fill, submit. Returns the input that was used. */
  async createRandomPolicy(productId: number, familyId: number, officerId: number): Promise<PolicyInput> {
    const input = generatePolicy(productId, familyId, officerId);
    await this.openAddForm();
    await this.fillPolicyForm(input);
    await this.submitForm();
    return input;
  }

  /** Filter policies by family head-insuree CHF ID. */
  async filterByChfId(chfId: string): Promise<void> {
    await this.searchInput.fill(chfId);
    await this.searchButton.click().catch(() => undefined);
    await this.waitForAppIdle();
  }

  /** Get the count of rows in the data grid (excluding header). */
  async rowCount(): Promise<number> {
    return await this.dataGridRow.count();
  }

  /** Returns the text of the first row. */
  async firstRowText(): Promise<string> {
    return ((await this.dataGridRow.first().textContent().catch(() => '')) ?? '').trim();
  }

  /** Returns the visible column headers. */
  async getColumnHeaders(): Promise<string[]> {
    return await this.dataGridHeader.allTextContents().then((arr) => arr.map((t) => t.trim()));
  }
}