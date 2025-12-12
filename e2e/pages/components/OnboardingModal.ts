import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Component Object for the Starting Balance Onboarding Modal.
 * Shown to new users to set their initial account balance.
 */
export class OnboardingModal {
  readonly modal: Locator;
  readonly amountInput: Locator;
  readonly dateInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.modal = page.getByTestId('onboarding-modal');
    this.amountInput = page.getByTestId('starting-balance-amount-input');
    this.dateInput = page.getByTestId('starting-balance-date-input');
    this.submitButton = page.getByTestId('starting-balance-submit-button');
  }

  /**
   * Wait for the onboarding modal to be visible
   */
  async waitForVisible(): Promise<void> {
    await expect(this.modal).toBeVisible({ timeout: 10000 });
  }

  /**
   * Wait for the onboarding modal to disappear
   */
  async waitForHidden(): Promise<void> {
    await expect(this.modal).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Fill in the starting amount
   */
  async fillAmount(amount: number): Promise<void> {
    await this.amountInput.fill(amount.toString());
  }

  /**
   * Fill in the effective date (format: YYYY-MM-DD)
   */
  async fillDate(date: string): Promise<void> {
    await this.dateInput.fill(date);
  }

  /**
   * Click the submit button
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete the onboarding flow with given values
   */
  async completeOnboarding(amount: number, date: string): Promise<void> {
    await this.fillAmount(amount);
    await this.fillDate(date);
    await this.clickSubmit();
    await this.waitForHidden();
  }

  /**
   * Assert that the modal is visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.modal).toBeVisible();
  }

  /**
   * Assert that the modal is not visible
   */
  async expectHidden(): Promise<void> {
    await expect(this.modal).not.toBeVisible();
  }

  /**
   * Check if the modal is currently visible
   */
  async isVisible(): Promise<boolean> {
    return await this.modal.isVisible();
  }
}

