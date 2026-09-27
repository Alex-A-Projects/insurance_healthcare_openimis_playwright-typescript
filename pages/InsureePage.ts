import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { InsureeInput, generateInsuree } from '../utils/testData';

/**
 * InsureePage - the openIMIS insuree searcher + form.
 *
 * Verified DOM selectors (from demo.openimis.org):
 *   - The searcher lives at /front/insuree/insurees
 *   - Form inputs have `name="chfId"`, `name="lastName"`,
 *     `name="givenName"`, `name="dob"`, `name="phone"`, `name="email"`
 *   - The "Add new Insuree" toolbar button opens the form
 *   - Filtering has a "Reset filters" + "Search" button pair
 *
 * Opening the page uses the app-bar dropdown ("Insurees and Policies" →
 * "Insurees") since direct navigation sometimes lands behind the
 * "Session Expired" modal.
 */
export class InsureePage extends BasePage {
  readonly addInsureeButton: Locator;
  readonly searchInput: Locator;
  readonly filterPanel: Locator;

  // Form fields (matched to the live `name=` attributes)
  readonly chfIdInput: Locator;
  readonly lastNameInput: Locator;
  readonly givenNameInput: Locator;
  readonly dobInput: Locator;
  readonly genderSelect: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly maritalSelect: Locator;
  readonly currentAddressInput: Locator;
  readonly headCheckbox: Locator;
  readonly familySelect: Locator;
  readonly villageSelect: Locator;
  readonly professionSelect: Locator;
  readonly educationSelect: Locator;
  readonly typeOfIdSelect: Locator;
  readonly passportInput: Locator;
  readonly photoUploadInput: Locator;

  /** @deprecated Use {@link givenNameInput} — kept for callers using `otherNames`. */
  readonly otherNamesInput: Locator;

  constructor(page: Page) {
    super(page);
    this.addInsureeButton = page
      .locator(
        'button:has-text("Add new Insuree"), button:has-text("Add new"), a:has-text("Add new Insuree")',
      )
      .first();
    this.searchInput = page
      .locator('input[placeholder*="nsuree" i], input[name="search"]')
      .first();
    this.filterPanel = page
      .locator('.MuiPaper-root:has-text("Filters"), .MuiAccordion-root:has-text("Filter")')
      .first();

    // Live `name=` attributes
    this.chfIdInput = page.locator('input[name="chfId"]').first();
    this.lastNameInput = page.locator('input[name="lastName"]').first();
    this.givenNameInput = page.locator('input[name="givenName"]').first();
    // Legacy alias
    this.otherNamesInput = this.givenNameInput;
    this.dobInput = page.locator('input[name="dob"]').first();
    this.genderSelect = page
      .locator('div:has(> label:has-text("Gender")) [role="combobox"]')
      .first();
    this.phoneInput = page.locator('input[name="phone"]').first();
    this.emailInput = page.locator('input[name="email"]').first();
    this.maritalSelect = page
      .locator('div:has(> label:has-text("Marital")) [role="combobox"]')
      .first();
    this.currentAddressInput = page
      .locator('input[name="currentAddress"], textarea[name="currentAddress"]')
      .first();
    this.headCheckbox = page.locator('input[type="checkbox"][name="head"]').first();
    this.familySelect = page
      .locator('div:has(> label:has-text("Family")) [role="combobox"]')
      .first();
    this.villageSelect = page
      .locator(
        'div:has(> label:has-text("Village")) [role="combobox"], div:has(> label:has-text("Location")) [role="combobox"]',
      )
      .first();
    this.professionSelect = page
      .locator('div:has(> label:has-text("Profession")) [role="combobox"]')
      .first();
    this.educationSelect = page
      .locator('div:has(> label:has-text("Education")) [role="combobox"]')
      .first();
    this.typeOfIdSelect = page
      .locator('div:has(> label:has-text("Identification")) [role="combobox"]')
      .first();
    this.passportInput = page.locator('input[name="passport"]').first();
    this.photoUploadInput = page.locator('input[type="file"]').first();
  }

  /** Open the insuree searcher via the app-bar dropdown. */
  async open(): Promise<void> {
    try {
      await this.navigateViaMenu('Insurees and Policies', 'Insurees');
    } catch {
      // Fall back to direct URL navigation if the menu isn't visible
      // (e.g. when tests run against a stripped-down build).
      await this.goto('/insuree/insurees');
    }
    await this.dismissBlockingDialogs();
  }

  /** Open the insuree searcher by URL (skips the menu). */
  async openByUrl(): Promise<void> {
    await this.goto('/insuree/insurees');
    await this.dismissBlockingDialogs();
  }

  /** Click the add-insuree button to open the form. */
  async openAddForm(): Promise<void> {
    await this.open();
    await this.addInsureeButton.waitFor({ state: 'visible', timeout: 15_000 });
    await this.addInsureeButton.click();
    await this.waitForAppIdle();
    await this.dismissBlockingDialogs();
  }

  /** Fill the insuree form with the supplied payload. */
  async fillInsureeForm(input: InsureeInput): Promise<void> {
    if (input.chfId) await this.chfIdInput.fill(input.chfId);
    if (input.lastName) await this.lastNameInput.fill(input.lastName);
    if (input.otherNames) await this.givenNameInput.fill(input.otherNames);
    if (input.dob) await this.dobInput.fill(input.dob);
    if (input.gender) {
      await this.genderSelect.click();
      await this.page
        .locator(
          `[role="option"]:has-text("${input.gender === 'M' ? 'Male' : 'Female'}"), li:has-text("${input.gender}")`,
        )
        .first()
        .click();
    }
    if (input.marital) {
      await this.maritalSelect.click();
      await this.page.locator(`[role="option"]:has-text("${input.marital}")`).first().click();
    }
    if (input.phone) await this.phoneInput.fill(input.phone);
    if (input.email) await this.emailInput.fill(input.email);
    if (input.currentAddress) await this.currentAddressInput.fill(input.currentAddress);
  }

  /** Submit the form and wait for the navigation back to the list. */
  async submitForm(): Promise<void> {
    await this.dismissBlockingDialogs();
    const submit = this.page
      .locator('button:has-text("Save"), button:has-text("Submit"), button[type="submit"]')
      .first();
    await Promise.all([
      this.page
        .waitForURL((u) => !u.pathname.endsWith('/insuree/insuree'), { timeout: 30_000 })
        .catch(() => undefined),
      submit.click(),
    ]);
    await this.waitForAppIdle();
  }

  /** Convenience: open form, fill with a fresh payload, submit. */
  async createRandomInsuree(prefix = 'qa'): Promise<InsureeInput> {
    const input = generateInsuree(prefix);
    await this.openAddForm();
    await this.fillInsureeForm(input);
    await this.submitForm();
    return input;
  }

  /** Filter by insurance number (CHF ID) using the header search input. */
  async filterByChfId(chfId: string): Promise<void> {
    await this.searchInput.fill(chfId);
    // Use the base class's Search button (inherited from BasePage).
    const btn = this.page.locator('button:has-text("Search")').first();
    await btn.click().catch(() => undefined);
    await this.waitForAppIdle();
  }

  /** Get the count of rows in the data grid (excluding header). */
  async rowCount(): Promise<number> {
    return await this.dataGridRow.count();
  }

  /** Read the first row's text content. */
  async firstRowText(): Promise<string> {
    return ((await this.dataGridRow.first().textContent().catch(() => '')) ?? '').trim();
  }

  /** Returns the text of the visible column headers. */
  async getColumnHeaders(): Promise<string[]> {
    return await this.dataGridHeader.allTextContents().then((arr) => arr.map((t) => t.trim()));
  }

  /** Open the n-th row's kebab/edit menu and click the edit action. */
  async editRowAt(index: number): Promise<void> {
    const row = this.dataGridRow.nth(index);
    await row
      .locator('button[aria-label*="more" i], button:has-text("Edit")')
      .first()
      .click()
      .catch(async () => {
        // MUI DataGrid often uses a kebab icon — try generic action button
        await row.locator('button').first().click();
      });
    await this.waitForAppIdle();
  }
}