import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { ClaimInput, generateClaim } from '../utils/testData';

/**
 * ClaimPage - the openIMIS medical claim screens.
 *
 * Routes:
 *   - /front/claim/healthFacilities  → HF Claims searcher
 *     (read-only; claims are entered by health facilities via mobile)
 *   - /front/claim/reviews           → Claim Review list
 *   - /front/claim/review            → Single claim review
 *   - /front/claim/claimEdit         → Edit claim
 *   - /front/claim/feedback          → Feedback form
 *   - /front/claim/attach            → Attach files
 *
 * Verified DOM selectors (from demo.openimis.org):
 *   - HF Claims page has NO "Add new claim" button — claims enter the
 *     system via the health facility's mobile app.
 *   - Toolbar buttons: "Reset filters", "Search", "Submit All".
 *
 * The review workflow progresses: Idle → Selected for Review → Reviewed →
 * Bypass Review. Feedback runs in parallel.
 */
export class ClaimPage extends BasePage {
  // HF Claims toolbar (no add button — claims enter via mobile)
  readonly addClaimButton: Locator;
  readonly submitButton: Locator;
  readonly submitAllButton: Locator;
  readonly selectCriteriaButton: Locator;
  readonly filterPanel: Locator;

  // Claim form (used by Review/Edit flows)
  readonly claimCodeInput: Locator;
  readonly insureeSearchInput: Locator;
  readonly insureePickerButton: Locator;
  readonly healthFacilitySelect: Locator;
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly dateClaimedInput: Locator;
  readonly diagnosisSelect: Locator;
  readonly visitTypeSelect: Locator;
  readonly careTypeSelect: Locator;
  readonly icd1Select: Locator;
  readonly icd2Select: Locator;
  readonly icd3Select: Locator;
  readonly icd4Select: Locator;
  readonly explanationInput: Locator;
  readonly servicesButton: Locator;
  readonly itemsButton: Locator;
  readonly attachmentsButton: Locator;
  readonly postButton: Locator;
  readonly saveButton: Locator;

  // Review
  readonly reviewStatusFilter: Locator;
  readonly feedbackStatusFilter: Locator;
  readonly selectForReviewButton: Locator;
  readonly bypassReviewButton: Locator;
  readonly skipReviewButton: Locator;
  readonly saveReviewButton: Locator;
  readonly deliverReviewButton: Locator;
  readonly approveForPaymentButton: Locator;
  readonly processButton: Locator;

  // Feedback
  readonly feedbackDateInput: Locator;
  readonly careRenderedCheckbox: Locator;
  readonly paymentAskedCheckbox: Locator;
  readonly drugPrescribedCheckbox: Locator;
  readonly drugReceivedCheckbox: Locator;
  readonly assessmentSelect: Locator;

  constructor(page: Page) {
    super(page);
    // Toolbar — HF claims page has Submit All (no Add new claim button).
    this.addClaimButton = page
      .locator('button:has-text("Add new claim"), a:has-text("Add new claim"), button:has-text("Add new")')
      .first();
    this.submitButton = page.locator('button:has-text("Submit Selected")').first();
    this.submitAllButton = page.locator('button:has-text("Submit All")').first();
    this.selectCriteriaButton = page.locator('button:has-text("Select Criteria")').first();
    this.filterPanel = page.locator('.MuiPaper-root:has-text("Filter")').first();

    // Claim form
    this.claimCodeInput = page.locator('input[name="code"]').first();
    this.insureeSearchInput = page.locator('input[placeholder*="nsuree" i]').first();
    this.insureePickerButton = page.locator('button:has-text("Pick Insuree")').first();
    this.healthFacilitySelect = page
      .locator('div:has(> label:has-text("Health Facility")) [role="combobox"]')
      .first();
    this.dateFromInput = page.locator('input[name="dateFrom"]').first();
    this.dateToInput = page.locator('input[name="dateTo"]').first();
    this.dateClaimedInput = page.locator('input[name="dateClaimed"]').first();
    this.diagnosisSelect = page
      .locator('div:has(> label:has-text("Main Diagnosis")) [role="combobox"]')
      .first();
    this.visitTypeSelect = page
      .locator('div:has(> label:has-text("Visit Type")) [role="combobox"]')
      .first();
    this.careTypeSelect = page
      .locator('div:has(> label:has-text("Care Type")) [role="combobox"]')
      .first();
    this.icd1Select = page
      .locator('div:has(> label:has-text("Sec. Diagnosis 1")) [role="combobox"]')
      .first();
    this.icd2Select = page
      .locator('div:has(> label:has-text("Sec. Diagnosis 2")) [role="combobox"]')
      .first();
    this.icd3Select = page
      .locator('div:has(> label:has-text("Sec. Diagnosis 3")) [role="combobox"]')
      .first();
    this.icd4Select = page
      .locator('div:has(> label:has-text("Sec. Diagnosis 4")) [role="combobox"]')
      .first();
    this.explanationInput = page.locator('textarea[name="explanation"]').first();
    this.servicesButton = page.locator('button:has-text("Add services"), button:has-text("Services")').first();
    this.itemsButton = page.locator('button:has-text("Add items"), button:has-text("Items")').first();
    this.attachmentsButton = page.locator('button:has-text("Attach")').first();
    this.postButton = page.locator('button:has-text("Post"), button:has-text("Submit Claim")').first();
    this.saveButton = page.locator('button:has-text("Save")').first();

    // Review
    this.reviewStatusFilter = page
      .locator('div:has(> label:has-text("Review Status")) [role="combobox"]')
      .first();
    this.feedbackStatusFilter = page
      .locator('div:has(> label:has-text("Feedback Status")) [role="combobox"]')
      .first();
    this.selectForReviewButton = page.locator('button:has-text("Select for Review")').first();
    this.bypassReviewButton = page.locator('button:has-text("Bypass Review")').first();
    this.skipReviewButton = page.locator('button:has-text("Skip Review")').first();
    this.saveReviewButton = page.locator('button:has-text("Save Review")').first();
    this.deliverReviewButton = page.locator('button:has-text("Deliver Review")').first();
    this.approveForPaymentButton = page.locator('button:has-text("APPROVE FOR PAYMENT")').first();
    this.processButton = page.locator('button:has-text("Process"), button:has-text("Process Claims")').first();

    // Feedback
    this.feedbackDateInput = page.locator('input[name="feedbackDate"]').first();
    this.careRenderedCheckbox = page.locator('input[type="checkbox"][name="careRendered"]').first();
    this.paymentAskedCheckbox = page.locator('input[type="checkbox"][name="paymentAsked"]').first();
    this.drugPrescribedCheckbox = page.locator('input[type="checkbox"][name="drugPrescribed"]').first();
    this.drugReceivedCheckbox = page.locator('input[type="checkbox"][name="drugReceived"]').first();
    this.assessmentSelect = page
      .locator('div:has(> label:has-text("Assessment")) [role="combobox"]')
      .first();
  }

  /** Open the HF Claims searcher. */
  async open(): Promise<void> {
    await this.goto('/claim/healthFacilities');
  }

  /** Open the Claims Review list. */
  async openReviewList(): Promise<void> {
    await this.goto('/claim/reviews');
  }

  /** Open the Feedback list. */
  async openFeedbackList(): Promise<void> {
    await this.goto('/claim/feedback');
  }

  /** Open the claim edit form. */
  async openClaimEdit(): Promise<void> {
    await this.goto('/claim/claimEdit');
  }

  /** Open the add-claim form. */
  async openAddForm(): Promise<void> {
    await this.open();
    await this.addClaimButton.waitFor({ state: 'visible', timeout: 15_000 });
    await this.addClaimButton.click();
    await this.waitForAppIdle();
  }

  /** Pick a value from a MUI Select dropdown by label text. */
  async pickSelect(selectLocator: Locator, label: string): Promise<void> {
    await selectLocator.click();
    await this.page.locator(`[role="option"]:has-text("${label}"), li:has-text("${label}")`).first().click();
  }

  /** Fill the claim form. */
  async fillClaimForm(input: ClaimInput): Promise<void> {
    if (input.dateFrom) await this.dateFromInput.fill(input.dateFrom);
    if (input.dateClaimed) await this.dateClaimedInput.fill(input.dateClaimed);
    if (input.careType) {
      await this.careTypeSelect.click();
      await this.page.locator(`[role="option"]:has-text("${input.careType}")`).first().click();
    }
    if (input.visitType) {
      await this.visitTypeSelect.click();
      await this.page.locator(`[role="option"]`).first().click();
    }
  }

  /** Submit the claim form (saves it in ENTERED status). */
  async submitForm(): Promise<void> {
    await Promise.all([
      this.page.waitForURL((u) => !u.pathname.endsWith('/claimEdit'), { timeout: 30_000 }).catch(() => undefined),
      this.postButton.click(),
    ]);
    await this.waitForAppIdle();
  }

  /** Convenience: open form, fill, submit. */
  async createRandomClaim(
    insureeId: number,
    healthFacilityId: number,
    adminId: number,
    icdId: number,
  ): Promise<ClaimInput> {
    const input = generateClaim(insureeId, healthFacilityId, adminId, icdId);
    await this.openAddForm();
    await this.fillClaimForm(input);
    await this.submitForm();
    return input;
  }

  /** Open the filter panel ("Select Criteria" button). */
  async openFilterPanel(): Promise<void> {
    if (await this.selectCriteriaButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await this.selectCriteriaButton.click();
      await this.waitForAppIdle();
    }
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
}