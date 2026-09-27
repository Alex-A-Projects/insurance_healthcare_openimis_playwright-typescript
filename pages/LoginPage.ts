import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { DemoCredentials } from '../utils/testData';

/**
 * LoginPage - the openIMIS login screen mounted at `/front/login`.
 *
 * Discovered DOM structure (verified against demo.openimis.org):
 *
 *   - Two `<input>` elements with no `name`/`id`/`placeholder` —
 *     the first is `type="text"` (username), the second is
 *     `type="password"` (password).
 *   - Two `<label>` elements wrapping the inputs, text "Username *"
 *     and "Password *" (the trailing `*` marks them as required).
 *   - One `<button type="submit">` with text "Log In".
 *   - One `<button>` with text "Forgot Password ?" that opens a modal.
 *
 * The earlier assumption that inputs had `name="username"` and
 * `name="password"` was based on outdated source comments; the live
 * bundle uses MUI `TextField` without explicit name attributes.
 */
export class LoginPage extends BasePage {
  /** First text-type input on the page = username. */
  readonly usernameInput: Locator;
  /** The single password input. */
  readonly passwordInput: Locator;
  /** The "Log In" submit button. */
  readonly loginButton: Locator;
  /** Any error alert shown after a failed login. */
  readonly errorMessage: Locator;
  /** "Forgot Password ?" button that opens the recovery modal. */
  readonly forgotPasswordButton: Locator;
  /** "Ok" button inside the Forgot Password modal. */
  readonly okButton: Locator;
  /** "Cancel" button inside the Forgot Password modal. */
  readonly cancelButton: Locator;
  /** `<label>` for the username field. */
  readonly usernameLabel: Locator;
  /** `<label>` for the password field. */
  readonly passwordLabel: Locator;
  readonly languagePicker: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('input[type="text"]').first();
    this.passwordInput = page.locator('input[type="password"]').first();
    this.loginButton = page.locator('button[type="submit"]:has-text("Log In"), button:has-text("Log In")').first();
    this.errorMessage = page.locator('.MuiAlert-root.MuiAlert-standardError, [role="alert"]').first();
    this.forgotPasswordButton = page.locator('button:has-text("Forgot Password")').first();
    this.okButton = page.locator('button:has-text("Ok")').first();
    this.cancelButton = page.locator('button:has-text("Cancel")').first();
    this.usernameLabel = page.locator('label').filter({ hasText: /^Username/ }).first();
    this.passwordLabel = page.locator('label').filter({ hasText: /^Password/ }).first();
    this.languagePicker = page.locator('[aria-label*="language" i], select[name="language"]').first();
    this.rememberMeCheckbox = page.locator('input[type="checkbox"][name="remember"]').first();
    this.backButton = page.locator('button:has-text("Back")').first();
  }

  /** Open the login page. If already authenticated, logs out first. */
  async open(): Promise<void> {
    await this.goto('/login');
    await this.dismissBlockingDialogs();
    // If we're already past /login, the SPA bounced us — log out first.
    if (!pageIsLogin(this.page)) {
      if (await this.logoutButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await this.logout();
        await this.goto('/login');
        await this.dismissBlockingDialogs();
      }
    }
  }

  /**
   * Fill and submit the login form. Returns once the navigation
   * leaves `/login`. Robust against the demo's persistent
   * "Session Expired" modal that sometimes pops up between fill
   * and submit.
   */
  async login(username: string = DemoCredentials.username, password: string = DemoCredentials.password): Promise<void> {
    await this.usernameInput.waitFor({ state: 'visible', timeout: 30_000 });
    // Dismiss any session-expired modal that's currently on top of
    // the form. Sometimes it reappears between fill() and click().
    await this.dismissBlockingDialogs();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);

    // The modal may reappear between fill() and click(). Wait for it
    // to clear, then click the button. Use a short polling loop with
    // retries to handle re-popping dialogs.
    for (let attempt = 0; attempt < 4; attempt++) {
      await this.dismissBlockingDialogs();
      const nav = this.page
        .waitForURL((url) => !pageIsLogin(this.page), { timeout: 10_000 })
        .catch(() => undefined);
      try {
        await Promise.all([nav, this.loginButton.click({ timeout: 5_000 })]);
      } catch {
        // Click was blocked by an intercepting dialog — dismiss and retry.
        await this.dismissBlockingDialogs();
        continue;
      }
      break;
    }
    await this.waitForAppIdle();
  }

  /**
   * The openIMIS demo shows a "Session Expired" modal on first visit
   * (and on most navigations back to /login). The modal has Ok +
   * Cancel buttons; clicking Ok dismisses it. This helper does the
   * dismissal if (and only if) the modal is currently shown.
   *
   * The dialog sometimes reappears immediately (the demo treats every
   * fresh `/login` visit as an expired session). Loop the dismissal
   * until either it stays gone or we've tried enough times.
   */
  async dismissBlockingDialogs(maxAttempts = 5): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const dialog = this.page.locator('[role="dialog"]:visible').first();
      if (!(await dialog.isVisible({ timeout: 500 }).catch(() => false))) {
        return; // no dialog → nothing to dismiss
      }
      const ok = dialog
        .locator('button:has-text("Ok"), button:has-text("OK"), button:has-text("Yes")')
        .first();
      if (!(await ok.isVisible({ timeout: 200 }).catch(() => false))) {
        // No ok button — try any button.
        const any = dialog.locator('button').first();
        if (await any.isVisible({ timeout: 200 }).catch(() => false)) {
          await any.click().catch(() => undefined);
        } else {
          // Last resort: dismiss with Escape.
          await this.page.keyboard.press('Escape').catch(() => undefined);
        }
      } else {
        await ok.click().catch(() => undefined);
      }
      await this.waitForAppIdle(3_000);
    }
  }

  /** Read the visible error message after a failed login. */
  async getErrorMessage(): Promise<string> {
    if (!(await this.errorMessage.isVisible({ timeout: 1_000 }).catch(() => false))) return '';
    return ((await this.errorMessage.textContent()) ?? '').trim();
  }

  /** True if an error message is visible. */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible({ timeout: 1_000 }).catch(() => false);
  }

  /** Attempt login and expect failure. Returns the visible error text. */
  async expectFailedLogin(username: string, password: string): Promise<string> {
    await this.open();
    await this.login(username, password);
    await this.page.waitForTimeout(1_500);
    return this.getErrorMessage();
  }

  /** Open the Forgot Password modal. */
  async openForgotPassword(): Promise<void> {
    if (await this.forgotPasswordButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await this.forgotPasswordButton.click();
      await this.waitForAppIdle();
    }
  }

  /** Close the Forgot Password modal (clicks Cancel). */
  async closeForgotPassword(): Promise<void> {
    if (await this.cancelButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await this.cancelButton.click();
      await this.waitForAppIdle();
    }
  }
}

/** True if the page URL ends in `/login` (e.g. `/front/login`). */
function pageIsLogin(page: Page): boolean {
  try {
    return new URL(page.url()).pathname.endsWith('/login');
  } catch {
    return false;
  }
}