import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * FamilyPage - the openIMIS family / group management.
 *
 * Routes:
 *   - /front/insuree/families    → family searcher
 *   - /front/insuree/family      → add / edit family form
 *   - /front/insuree/familyOverview → single family overview
 */
export class FamilyPage extends BasePage {
  readonly addFamilyButton: Locator;
  readonly searchInput: Locator;

  readonly headInsureeSelect: Locator;
  readonly locationPicker: Locator;
  readonly addressInput: Locator;
  readonly povertyCheckbox: Locator;
  readonly familyTypeSelect: Locator;
  readonly confirmationTypeSelect: Locator;
  readonly confirmationNoInput: Locator;

  constructor(page: Page) {
    super(page);
    this.addFamilyButton = page.locator('button:has-text("Add Family"), a:has-text("Add Family"), button:has-text("Add new")').first();
    this.searchInput = page.locator('input[placeholder*="search" i], input[name="search"]').first();

    this.headInsureeSelect = page.locator('div:has(> label:has-text("Head")) [role="combobox"], div:has(> label:has-text("Head Insuree")) [role="combobox"]').first();
    this.locationPicker = page.locator('div:has(> label:has-text("Location")) [role="combobox"], div:has(> label:has-text("Region")) [role="combobox"]').first();
    this.addressInput = page.locator('input[name="address"], textarea[name="address"]').first();
    this.povertyCheckbox = page.locator('input[type="checkbox"][name="poverty"]').first();
    this.familyTypeSelect = page.locator('div:has(> label:has-text("Family Type")) [role="combobox"]').first();
    this.confirmationTypeSelect = page.locator('div:has(> label:has-text("Confirmation")) [role="combobox"]').first();
    this.confirmationNoInput = page.locator('input[name="confirmationNo"]').first();
  }

  async open(): Promise<void> {
    await this.goto('/insuree/families');
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

  /** Returns the visible count of family members on a family overview page. */
  async memberCount(): Promise<number> {
    return await this.dataGridRow.count();
  }
}