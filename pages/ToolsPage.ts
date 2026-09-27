import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ToolsPage - the openIMIS tools menu.
 *
 * Routes:
 *   - /front/tools/reports         → Standard reports (OpenSearch-backed)
 *   - /front/tools/extracts        → Data extracts (bulk file downloads)
 *   - /front/tools/registers       → Registers / audit logs
 *   - /front/tools/imports         → Bulk import flows
 *   - /front/tools/exports         → Bulk export flows
 */
export class ToolsPage extends BasePage {
  readonly reportsLink: Locator;
  readonly extractsLink: Locator;
  readonly registersLink: Locator;
  readonly importsLink: Locator;
  readonly exportsLink: Locator;
  readonly feedbacksLink: Locator;
  readonly renewalsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.reportsLink = page.locator('a:has-text("Reports"), button:has-text("Reports"), [role="menuitem"]:has-text("Reports")').first();
    this.extractsLink = page.locator('a:has-text("Extracts"), button:has-text("Extracts"), [role="menuitem"]:has-text("Extracts")').first();
    this.registersLink = page.locator('a:has-text("Registers"), button:has-text("Registers")').first();
    this.importsLink = page.locator('a:has-text("Imports"), button:has-text("Imports")').first();
    this.exportsLink = page.locator('a:has-text("Exports"), button:has-text("Exports")').first();
    this.feedbacksLink = page.locator('a:has-text("Feedbacks"), button:has-text("Feedbacks")').first();
    this.renewalsLink = page.locator('a:has-text("Renewals"), button:has-text("Renewals")').first();
  }

  async open(): Promise<void> {
    await this.goto('/tools/reports');
  }

  async openExtracts(): Promise<void> {
    await this.goto('/tools/extracts');
  }

  async openImports(): Promise<void> {
    await this.goto('/tools/imports');
  }

  async openExports(): Promise<void> {
    await this.goto('/tools/exports');
  }

  async openRegisters(): Promise<void> {
    await this.goto('/tools/registers');
  }

  async openFeedbacks(): Promise<void> {
    await this.goto('/tools/feedbacks');
  }

  async openRenewals(): Promise<void> {
    await this.goto('/tools/renewals');
  }

  /** Returns true if the page reports no data (empty grid). */
  async isEmpty(): Promise<boolean> {
    const count = await this.dataGridRow.count();
    return count === 0;
  }
}