import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { ProductInput, generateProduct } from '../utils/testData';

/**
 * ProductPage - the openIMIS insurance product catalogue.
 *
 * Routes:
 *   - /front/admin/products       → searcher
 *   - /front/admin/product        → edit form (rarely visited directly)
 *
 * In the demo, products are typically managed via Django admin, not the
 * SPA. The searcher is read-only; CRUD goes through GraphQL.
 */
export class ProductPage extends BasePage {
  readonly addButton: Locator;
  readonly duplicateButton: Locator;
  readonly deleteButton: Locator;
  readonly searchInput: Locator;

  readonly codeInput: Locator;
  readonly nameInput: Locator;
  readonly maxMembersInput: Locator;
  readonly ageMinInput: Locator;
  readonly ageMaxInput: Locator;
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly premiumAdultInput: Locator;
  readonly premiumChildInput: Locator;

  constructor(page: Page) {
    super(page);
    this.addButton = page.locator('button:has-text("Add new product"), a:has-text("Add new product"), button:has-text("Add new")').first();
    this.duplicateButton = page.locator('button:has-text("Duplicate"), a:has-text("Duplicate")').first();
    this.deleteButton = page.locator('button:has-text("Delete"), a:has-text("Delete")').first();
    this.searchInput = page.locator('input[placeholder*="search" i], input[name="search"]').first();

    this.codeInput = page.locator('input[name="code"], input[name="productCode"]').first();
    this.nameInput = page.locator('input[name="name"], input[name="productName"]').first();
    this.maxMembersInput = page.locator('input[name="maxMembers"]').first();
    this.ageMinInput = page.locator('input[name="ageMin"], input[name="ageMinimal"]').first();
    this.ageMaxInput = page.locator('input[name="ageMax"], input[name="ageMaximal"]').first();
    this.dateFromInput = page.locator('input[name="dateFrom"]').first();
    this.dateToInput = page.locator('input[name="dateTo"]').first();
    this.premiumAdultInput = page.locator('input[name="premiumAdult"]').first();
    this.premiumChildInput = page.locator('input[name="premiumChild"]').first();
  }

  async open(): Promise<void> {
    await this.goto('/admin/products');
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

  /** Filter by product code (uses the searcher textbox). */
  async filterByCode(code: string): Promise<void> {
    await this.searchInput.fill(code);
    await this.searchInput.press('Enter');
    await this.waitForAppIdle();
  }

  /** Helper: returns true if a product row with the supplied code is visible. */
  async hasProductWithCode(code: string): Promise<boolean> {
    await this.filterByCode(code);
    const text = (await this.dataGridRow.allTextContents()).join('\n');
    return text.includes(code);
  }
}