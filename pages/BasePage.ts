import { Page, Locator } from '@playwright/test';

/**
 * BasePage - shared behaviour for every Page Object in the openIMIS suite.
 *
 * openIMIS' frontend is a React + Material UI SPA mounted under `/front/`.
 * The actual app-bar layout (verified against demo.openimis.org) is:
 *
 *   - Top app bar with the logo, a search field ("Insuree enquiry…"),
 *     a row of dropdown-menu buttons ("Insurees and Policies",
 *     "Claims", "Administration", "Tools", "Profile", etc.),
 *     and a language picker.
 *
 *   - Each dropdown button opens a Material UI `<Menu>` with
 *     `<a href="/front/...">` items — clicking an item navigates.
 *
 *   - The search pages use a DataGrid for lists and MUI TextField /
 *     Select / DatePicker for inputs (some have `name=` attributes,
 *     most do not).
 *
 *   - On first visit the demo shows a "Session Expired" modal — the
 *     `LoginPage` auto-dismisses it.
 *
 * Locators below lean on text + ARIA + role selectors that survive
 * MUI upgrades. We avoid React-internal hooks like `data-testid`.
 */
export class BasePage {
  /** Canonical openIMIS demo URL. */
  static readonly BASE_URL = process.env.OPENIMIS_BASE_URL ?? 'https://demo.openimis.org';

  /** All SPA routes are mounted under `/front/`. */
  static readonly SPA_PREFIX = '/front';

  readonly page: Page;

  /**
   * The base URL every POM uses for navigation. Tests can override it
   * with `setBaseUrl(...)` when running against a local Docker instance.
   */
  private baseUrl: string = BasePage.BASE_URL;

  // App bar
  readonly logoLink: Locator;
  readonly appBar: Locator;
  readonly logoutButton: Locator;
  readonly usernameChip: Locator;
  readonly headerSearchInput: Locator;
  readonly appBarDropdowns: Locator;

  // Sidebar module groups (in display order)
  readonly socialProtectionMenu: Locator;
  readonly dashboardsMenu: Locator;
  readonly insureesAndPoliciesMenu: Locator;
  readonly claimsMenu: Locator;
  readonly administrationMenu: Locator;
  readonly toolsMenu: Locator;
  readonly profileMenu: Locator;
  readonly tasksManagementMenu: Locator;
  readonly legalAndFinanceMenu: Locator;
  readonly grievanceMenu: Locator;

  // Generic MUI components
  readonly muiDialog: Locator;
  readonly muiDialogTitle: Locator;
  readonly muiDialogActions: Locator;
  readonly muiSnackbar: Locator;

  // MUI DataGrid
  readonly dataGrid: Locator;
  readonly dataGridRow: Locator;
  readonly dataGridCell: Locator;
  readonly dataGridHeader: Locator;
  readonly dataGridLoading: Locator;
  readonly dataGridCheckbox: Locator;
  readonly dataGridPaginationNext: Locator;
  readonly dataGridPaginationPrev: Locator;
  readonly dataGridRowsPerPage: Locator;

  // Filter bar
  readonly resetFiltersButton: Locator;
  readonly searchButton: Locator;

  // Loader
  readonly muiBackdrop: Locator;
  readonly muiCircularProgress: Locator;

  constructor(page: Page) {
    this.page = page;

    // App bar / chrome
    this.logoLink = page.locator('button:has-text("openIMIS"), a[aria-label*="openIMIS" i]').first();
    this.appBar = page.locator('header.MuiAppBar-root').first();
    this.logoutButton = page.locator('button:has-text("Logout"), [data-testid="logout-button"], [aria-label*="logout" i]').first();
    this.usernameChip = page.locator('.MuiChip-root').first();
    this.headerSearchInput = page.locator('input[placeholder*="nsuree" i], header input[type="text"]').first();
    this.appBarDropdowns = page.locator('header.MuiAppBar-root button[aria-haspopup="menu"], header.MuiToolbar-root button');

    // Sidebar module buttons
    this.socialProtectionMenu = page.locator('header button:has-text("Social Protection"), .MuiToolbar-root button:has-text("Social Protection")').first();
    this.dashboardsMenu = page.locator('header button:has-text("Dashboards")').first();
    this.insureesAndPoliciesMenu = page.locator('header button:has-text("Insurees and Policies")').first();
    this.claimsMenu = page.locator('header button:has-text("Claims")').first();
    this.administrationMenu = page.locator('header button:has-text("Administration")').first();
    this.toolsMenu = page.locator('header button:has-text("Tools")').first();
    this.profileMenu = page.locator('header button:has-text("Profile")').first();
    this.tasksManagementMenu = page.locator('header button:has-text("Tasks Management")').first();
    this.legalAndFinanceMenu = page.locator('header button:has-text("Legal and Finance")').first();
    this.grievanceMenu = page.locator('header button:has-text("Grievance")').first();

    // MUI components
    this.muiDialog = page.locator('[role="dialog"], .MuiDialog-root').first();
    this.muiDialogTitle = page.locator('.MuiDialogTitle-root').first();
    this.muiDialogActions = page.locator('.MuiDialogActions-root').first();
    this.muiSnackbar = page.locator('.MuiSnackbar-root .MuiAlert-message, .MuiAlert-root .MuiAlert-message');

    // MUI DataGrid
    this.dataGrid = page.locator('.MuiDataGrid-root').first();
    this.dataGridRow = page.locator('.MuiDataGrid-row');
    this.dataGridCell = page.locator('.MuiDataGrid-cell');
    this.dataGridHeader = page.locator('.MuiDataGrid-columnHeader');
    this.dataGridLoading = page.locator('.MuiDataGrid-loadingOverlay');
    this.dataGridCheckbox = page.locator('[aria-label="Select Row checkbox"], input[type="checkbox"][data-indeterminate]');
    this.dataGridPaginationNext = page.locator('button[aria-label="Next page"], [aria-label*="next page" i]').first();
    this.dataGridPaginationPrev = page.locator('button[aria-label="Previous page"], [aria-label*="previous page" i]').first();
    this.dataGridRowsPerPage = page.locator('.MuiTablePagination-select, [aria-label*="rows per page" i]').first();

    // Filter bar
    this.resetFiltersButton = page.locator('button:has-text("Reset filters")').first();
    this.searchButton = page.locator('button:has-text("Search")').first();

    // Loaders
    this.muiBackdrop = page.locator('.MuiBackdrop-root');
    this.muiCircularProgress = page.locator('.MuiCircularProgress-root');
  }

  /** Override the base URL for this instance. */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /** The base URL every POM uses for navigation. */
  get baseURL(): string {
    return this.baseUrl;
  }

  /**
   * Navigate to a path resolved against BASE_URL. If the path doesn't
   * start with `/front/`, the SPA prefix is added automatically.
   *
   * Retries on timeout — the public demo at demo.openimis.org can take
   * 30-60s to respond when busy. Up to 3 attempts with exponential
   * backoff.
   */
  async goto(path = ''): Promise<void> {
    let target = path;
    if (!target) target = BasePage.SPA_PREFIX;
    if (
      target.startsWith('/') &&
      !target.startsWith(BasePage.SPA_PREFIX + '/') &&
      target !== BasePage.SPA_PREFIX &&
      !target.startsWith('http')
    ) {
      target = BasePage.SPA_PREFIX + (target.startsWith('/') ? target : '/' + target);
    }
    const absolute = target.startsWith('http')
      ? target
      : new URL(
          target.startsWith('/') ? target.slice(1) : target,
          this.baseUrl.endsWith('/') ? this.baseUrl : this.baseUrl + '/',
        ).toString();

    const maxAttempts = 3;
    let lastErr: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.page.goto(absolute, {
          waitUntil: 'load',
          timeout: 120_000,
        });
        await this.waitForAppIdle(30_000);
        await this.dismissBlockingDialogs();
        return;
      } catch (err) {
        lastErr = err;
        const waitMs = 3_000 * Math.pow(2, attempt);
        console.warn(
          `[BasePage.goto] attempt ${attempt + 1}/${maxAttempts} failed (${(err as Error).message?.split('\n')[0] ?? ''}); retrying in ${waitMs}ms`,
        );
        await this.page.waitForTimeout(waitMs);
      }
    }
    throw lastErr;
  }

  /** Wait for any visible MUI loader/backdrop to clear. */
  async waitForAppIdle(timeoutMs = 15_000): Promise<void> {
    await this.page
      .waitForFunction(
        () => {
          const backdrops = document.querySelectorAll('.MuiBackdrop-root');
          const visible = Array.from(backdrops).filter((b) => {
            const el = b as HTMLElement;
            const opacity = parseFloat(el.style.opacity || '0');
            return opacity > 0 && !el.classList.contains('MuiBackdrop-invisible');
          });
          const progress = document.querySelectorAll('.MuiCircularProgress-root');
          const overlay = document.querySelectorAll('.MuiDataGrid-loadingOverlay');
          return visible.length === 0 && progress.length === 0 && overlay.length === 0;
        },
        undefined,
        { timeout: timeoutMs },
      )
      .catch(() => undefined);
  }

  /** Get the current page title. */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Dismiss any visible blocking MUI dialog (e.g. the "Session Expired"
   * modal the demo throws up on most navigations). Looks for a dialog
   * with visible Ok/Cancel/Close buttons and clicks the affirmative.
   */
  async dismissBlockingDialogs(): Promise<void> {
    const dialog = this.page.locator('[role="dialog"]:visible').first();
    if (!(await dialog.isVisible({ timeout: 1_000 }).catch(() => false))) return;
    const ok = dialog.locator('button:has-text("Ok"), button:has-text("OK"), button:has-text("Yes")').first();
    if (await ok.isVisible({ timeout: 500 }).catch(() => false)) {
      await ok.click();
      await this.waitForAppIdle(5_000);
    } else {
      // Fall back: click any visible button inside the dialog.
      const any = dialog.locator('button').first();
      if (await any.isVisible({ timeout: 500 }).catch(() => false)) {
        await any.click();
        await this.waitForAppIdle(5_000);
      }
    }
  }

  /**
   * Navigate via the top app-bar dropdown menus.
   *
   *   1. Click the top-level menu button (e.g. "Insurees and Policies")
   *   2. Click the sub-item (e.g. "Insurees") inside the open Menu
   *   3. Wait for navigation
   *
   * Returns once the URL has changed away from the menu source.
   */
  async navigateViaMenu(menuLabel: string, itemLabel: string): Promise<void> {
    // Click the menu trigger
    const trigger = this.page
      .locator(
        `header button:has-text("${menuLabel}"), .MuiToolbar-root button:has-text("${menuLabel}")`,
      )
      .first();
    if (!(await trigger.isVisible({ timeout: 5_000 }).catch(() => false))) {
      throw new Error(`Menu trigger "${menuLabel}" not found`);
    }
    await trigger.click();
    await this.waitForAppIdle(3_000);

    // Click the item — prefer <a>, fall back to <li role="menuitem">.
    const item = this.page
      .locator(
        `a:has-text("${itemLabel}"), [role="menuitem"]:has-text("${itemLabel}"), li:has-text("${itemLabel}")`,
      )
      .first();
    if (!(await item.isVisible({ timeout: 5_000 }).catch(() => false))) {
      throw new Error(`Menu item "${itemLabel}" not visible after opening "${menuLabel}"`);
    }
    await Promise.all([
      this.page.waitForURL((url) => url.pathname !== new URL(this.page.url()).pathname, {
        timeout: 15_000,
      }).catch(() => undefined),
      item.click(),
    ]);
    await this.waitForAppIdle();
  }

  /** Close any open modal dialog by pressing Escape. */
  async closeOpenDialog(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.waitForAppIdle();
  }

  /** Returns true if a MUI Snackbar (toast) is currently visible. */
  async hasSnackbar(): Promise<boolean> {
    return await this.muiSnackbar.first().isVisible({ timeout: 1_000 }).catch(() => false);
  }

  /** Text of the latest toast (empty string if none). */
  async getLatestSnackbarText(): Promise<string> {
    if (!(await this.hasSnackbar())) return '';
    return ((await this.muiSnackbar.first().textContent()) ?? '').trim();
  }

  /** Wait for the snackbar (toast) to appear and return its text. */
  async waitForSnackbar(timeoutMs = 10_000): Promise<string> {
    await this.muiSnackbar.first().waitFor({ state: 'visible', timeout: timeoutMs });
    return ((await this.muiSnackbar.first().textContent()) ?? '').trim();
  }

  /** Returns the URL pathname (no query, no hash). */
  async getPathname(): Promise<string> {
    return new URL(this.page.url()).pathname;
  }

  /** Click the logout button (via the Profile menu). */
  async logout(): Promise<void> {
    // The Profile dropdown has a logout link inside.
    if (await this.profileMenu.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await this.profileMenu.click();
      await this.waitForAppIdle(1_500);
      const logout = this.page
        .locator('a:has-text("Logout"), [role="menuitem"]:has-text("Logout")')
        .first();
      if (await logout.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await logout.click();
        await this.waitForAppIdle();
        return;
      }
    }
    // Fall back: any Logout button.
    if (await this.logoutButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await this.logoutButton.click();
      await this.waitForAppIdle();
    }
  }

  /** Fill an input by its `name` attribute (the most reliable openIMIS selector). */
  async fillByName(name: string, value: string): Promise<void> {
    const input = this.page.locator(`input[name="${name}"], textarea[name="${name}"]`).first();
    await input.waitFor({ state: 'visible', timeout: 10_000 });
    await input.fill(value);
  }

  /** Click a button by its accessible name / text. */
  async clickByText(text: string | RegExp): Promise<void> {
    const btn = this.page.getByRole('button', { name: text }).first();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
  }
}