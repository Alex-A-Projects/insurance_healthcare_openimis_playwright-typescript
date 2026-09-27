import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { UserInput, generateUser } from '../utils/testData';

/**
 * UserAdminPage - the openIMIS system user administration.
 *
 * Routes:
 *   - /front/admin/users              → user list (DataGrid)
 *   - /front/admin/userEdit           → user edit form
 *   - /front/admin/roles              → role list
 *   - /front/admin/claimAdministrators → claim admins
 *   - /front/admin/enrolmentOfficers   → enrolment officers
 */
export class UserAdminPage extends BasePage {
  readonly addUserButton: Locator;
  readonly deleteUserButton: Locator;
  readonly searchInput: Locator;

  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly rolesSelect: Locator;
  readonly isActiveSwitch: Locator;

  constructor(page: Page) {
    super(page);
    this.addUserButton = page.locator('button:has-text("Add new user"), a:has-text("Add new user"), button:has-text("Add new")').first();
    this.deleteUserButton = page.locator('button:has-text("Delete user"), button:has-text("Delete"), a:has-text("Delete")').first();
    this.searchInput = page.locator('input[placeholder*="search" i], input[name="search"]').first();

    this.usernameInput = page.locator('input[name="username"]').first();
    this.emailInput = page.locator('input[name="email"]').first();
    this.firstNameInput = page.locator('input[name="firstName"], input[name="first_name"]').first();
    this.lastNameInput = page.locator('input[name="lastName"], input[name="last_name"]').first();
    this.passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[name="confirmPassword"], input[name="confirm"]').first();
    this.rolesSelect = page.locator('div:has(> label:has-text("Roles")) [role="combobox"]').first();
    this.isActiveSwitch = page.locator('input[type="checkbox"][name="isActive"], button[role="switch"][aria-label*="active" i]').first();
  }

  async open(): Promise<void> {
    await this.goto('/admin/users');
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

  /** Filter by username. */
  async filterByUsername(username: string): Promise<void> {
    await this.searchInput.fill(username);
    await this.searchInput.press('Enter');
    await this.waitForAppIdle();
  }

  /** Helper: returns true if a user row with the supplied username is visible. */
  async hasUserWithUsername(username: string): Promise<boolean> {
    await this.filterByUsername(username);
    const text = (await this.dataGridRow.allTextContents()).join('\n');
    return text.includes(username);
  }
}