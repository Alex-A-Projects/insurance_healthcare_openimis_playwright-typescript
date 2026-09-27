import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { HealthFacilityInput, generateHealthFacility } from '../utils/testData';

/**
 * HealthFacilityPage - the openIMIS health-facility catalogue.
 *
 * Routes:
 *   - /front/admin/healthFacilities    → searcher / list
 *   - /front/location/healthFacility   → detail / read-only view
 *   - /front/location/healthFacilityEdit → edit form
 */
export class HealthFacilityPage extends BasePage {
  readonly addButton: Locator;
  readonly deleteButton: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;

  readonly codeInput: Locator;
  readonly nameInput: Locator;
  readonly levelSelect: Locator;
  readonly careTypeSelect: Locator;
  readonly legalFormSelect: Locator;
  readonly locationPicker: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly contractStartDateInput: Locator;
  readonly contractEndDateInput: Locator;

  constructor(page: Page) {
    super(page);
    this.addButton = page.locator('button:has-text("Add new"), a:has-text("Add new"), button:has-text("Add Health Facility")').first();
    this.deleteButton = page.locator('button:has-text("Delete"), a:has-text("Delete")').first();
    this.searchInput = page.locator('input[placeholder*="search" i], input[name="search"]').first();
    this.filterButton = page.locator('button:has-text("Filter"), a:has-text("Filter")').first();

    this.codeInput = page.locator('input[name="code"], input[name="hfCode"]').first();
    this.nameInput = page.locator('input[name="name"], input[name="hfName"]').first();
    this.levelSelect = page.locator('div:has(> label:has-text("Level")) [role="combobox"]').first();
    this.careTypeSelect = page.locator('div:has(> label:has-text("Care Type")) [role="combobox"]').first();
    this.legalFormSelect = page.locator('div:has(> label:has-text("Legal Form")) [role="combobox"]').first();
    this.locationPicker = page.locator('div:has(> label:has-text("Location")) [role="combobox"], div:has(> label:has-text("Region")) [role="combobox"]').first();
    this.phoneInput = page.locator('input[name="phone"]').first();
    this.emailInput = page.locator('input[name="email"]').first();
    this.contractStartDateInput = page.locator('input[name="contractStartDate"]').first();
    this.contractEndDateInput = page.locator('input[name="contractEndDate"]').first();
  }

  async open(): Promise<void> {
    await this.goto('/admin/healthFacilities');
  }

  /** Pick a value from a MUI Select dropdown by label text. */
  async pickSelect(selectLocator: Locator, label: string): Promise<void> {
    await selectLocator.click();
    await this.page.locator(`[role="option"]:has-text("${label}"), li:has-text("${label}")`).first().click();
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

  /** Filter by HF code. */
  async filterByCode(code: string): Promise<void> {
    await this.searchInput.fill(code);
    await this.searchInput.press('Enter');
    await this.waitForAppIdle();
  }

  /** Helper: returns true if a health facility row with the supplied code is visible. */
  async hasHealthFacilityWithCode(code: string): Promise<boolean> {
    await this.filterByCode(code);
    const text = (await this.dataGridRow.allTextContents()).join('\n');
    return text.includes(code);
  }
}