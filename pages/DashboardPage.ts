import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * DashboardPage - the page that lands after a successful login.
 *
 * The openIMIS frontend shows a module picker / quick-links panel.
 * Different modules mount here depending on the user's rights; in the
 * demo (logged in as Admin) you get links to every module.
 */
export class DashboardPage extends BasePage {
  readonly greetingHeading: Locator;
  readonly moduleLinks: Locator;
  readonly quickInsureeLink: Locator;
  readonly quickPolicyLink: Locator;
  readonly quickClaimLink: Locator;
  readonly quickProductLink: Locator;
  readonly quickHealthFacilityLink: Locator;
  readonly quickUserLink: Locator;
  readonly quickToolsLink: Locator;
  readonly breadcrumbs: Locator;

  constructor(page: Page) {
    super(page);
    this.greetingHeading = page.locator('h1, .MuiTypography-h4, .MuiTypography-h5').first();
    this.moduleLinks = page.locator('.MuiCard-root a, .MuiGrid-root a, [class*="module"] a');
    this.quickInsureeLink = page.locator('a:has-text("Insuree"), [role="button"]:has-text("Insuree")').first();
    this.quickPolicyLink = page.locator('a:has-text("Policy"), [role="button"]:has-text("Policy")').first();
    this.quickClaimLink = page.locator('a:has-text("Claim"), [role="button"]:has-text("Claim")').first();
    this.quickProductLink = page.locator('a:has-text("Product"), [role="button"]:has-text("Product")').first();
    this.quickHealthFacilityLink = page.locator('a:has-text("Health Facility"), a:has-text("Hospital"), [role="button"]:has-text("Health Facility")').first();
    this.quickUserLink = page.locator('a:has-text("User"), a:has-text("Admin"), [role="button"]:has-text("Users")').first();
    this.quickToolsLink = page.locator('a:has-text("Tools"), [role="button"]:has-text("Tools")').first();
    this.breadcrumbs = page.locator('.MuiBreadcrumbs-root, [aria-label*="breadcrumb" i]').first();
  }

  /** Open the dashboard (assumes already logged in). */
  async open(): Promise<void> {
    await this.goto('/');
    await this.waitForAppIdle();
  }

  /** Get the welcome greeting (first heading on the page). */
  async getGreeting(): Promise<string> {
    return ((await this.greetingHeading.textContent()) ?? '').trim();
  }

  /** Returns the list of visible quick-link labels. */
  async getVisibleModuleLinks(): Promise<string[]> {
    return await this.moduleLinks.allTextContents().then((arr) => arr.map((t) => t.trim()));
  }

  /** Returns the breadcrumb trail text. */
  async getBreadcrumbText(): Promise<string> {
    return ((await this.breadcrumbs.textContent().catch(() => '')) ?? '').trim();
  }
}