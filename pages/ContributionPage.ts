import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ContributionPage - the openIMIS contribution / premium screens.
 *
 * Routes:
 *   - /front/contribution/contributions → contribution searcher
 *   - /front/contributionPlan             → contribution plan edit
 *
 * Premiums are linked to policies via `tblPremium.PolicyID`. The searcher
 * shows pay date, amount, receipt, payer, policy code.
 */
export class ContributionPage extends BasePage {
  readonly addContributionButton: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;

  readonly policySelect: Locator;
  readonly receiptInput: Locator;
  readonly payDateInput: Locator;
  readonly amountInput: Locator;
  readonly payTypeSelect: Locator;
  readonly payerPicker: Locator;

  constructor(page: Page) {
    super(page);
    this.addContributionButton = page.locator('button:has-text("Add a contribution"), button:has-text("Add new contribution"), button:has-text("Add new")').first();
    this.searchInput = page.locator('input[placeholder*="search" i], input[name="search"]').first();
    this.filterButton = page.locator('button:has-text("Filter"), a:has-text("Filter")').first();

    this.policySelect = page.locator('div:has(> label:has-text("Policy")) [role="combobox"]').first();
    this.receiptInput = page.locator('input[name="receipt"]').first();
    this.payDateInput = page.locator('input[name="payDate"]').first();
    this.amountInput = page.locator('input[name="amount"]').first();
    this.payTypeSelect = page.locator('div:has(> label:has-text("Pay Type")) [role="combobox"]').first();
    this.payerPicker = page.locator('div:has(> label:has-text("Payer")) [role="combobox"]').first();
  }

  async open(): Promise<void> {
    await this.goto('/contribution/contributions');
  }

  /** Get the count of rows in the data grid. */
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

  /** Filter by receipt number. */
  async filterByReceipt(receipt: string): Promise<void> {
    await this.searchInput.fill(receipt);
    await this.searchInput.press('Enter');
    await this.waitForAppIdle();
  }

  /** Helper: returns true if a contribution row with the supplied receipt is visible. */
  async hasContributionWithReceipt(receipt: string): Promise<boolean> {
    await this.filterByReceipt(receipt);
    const text = (await this.dataGridRow.allTextContents()).join('\n');
    return text.includes(receipt);
  }
}