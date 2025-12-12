import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Component Object for the Projection Panel.
 * Displays the projected balance and calculation breakdown.
 */
export class ProjectionPanel {
  readonly balanceDisplay: Locator;
  readonly projectedBalanceAmount: Locator;
  readonly projectionDateInput: Locator;

  constructor(private readonly page: Page) {
    this.balanceDisplay = page.getByTestId('balance-display');
    this.projectedBalanceAmount = page.getByTestId('projected-balance-amount');
    this.projectionDateInput = page.getByTestId('projection-date-input');
  }

  /**
   * Get the displayed projected balance text
   */
  async getBalanceText(): Promise<string> {
    return await this.projectedBalanceAmount.textContent() ?? '';
  }

  /**
   * Wait for balance to be displayed (not loading)
   */
  async waitForBalanceLoaded(): Promise<void> {
    await expect(this.balanceDisplay).toBeVisible({ timeout: 10000 });
    await expect(this.projectedBalanceAmount).toBeVisible({ timeout: 10000 });
  }

  /**
   * Assert that the projected balance contains specific text
   */
  async expectBalanceToContain(text: string): Promise<void> {
    await expect(this.projectedBalanceAmount).toContainText(text);
  }

  /**
   * Assert that the projected balance matches exact text
   */
  async expectBalanceText(text: string): Promise<void> {
    await expect(this.projectedBalanceAmount).toHaveText(text);
  }

  /**
   * Assert that the balance display is visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.balanceDisplay).toBeVisible();
  }

  /**
   * Set the projection date
   * @param dateString Format: 'YYYY-MM-DD'
   */
  async setProjectionDate(dateString: string): Promise<void> {
    await this.projectionDateInput.fill(dateString);
    // Trigger change event by pressing Enter
    await this.projectionDateInput.press('Enter');
  }

  /**
   * Wait for balance to update after date change
   */
  async waitForBalanceUpdate(timeout?: number): Promise<void> {
    // Wait for the balance display to be visible and have content
    await expect(this.projectedBalanceAmount).toBeVisible({ timeout });
    // Give a moment for the API call to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the projected balance as a number
   */
  async getBalanceAmount(): Promise<number> {
    const text = await this.projectedBalanceAmount.textContent() ?? '';
    // Handle European number format (e.g., "6 640,00 zł" or "-1 234,56 zł")
    // 1. Remove currency symbols and whitespace used as thousand separators
    // 2. Replace comma with dot for decimal separator
    const cleanedText = text
      .replace(/[^\d,.-]/g, '')  // Keep only digits, comma, dot, minus
      .replace(/\s/g, '')         // Remove any remaining whitespace
      .replace(/\./g, '')         // Remove dots (thousand separators in some formats)
      .replace(',', '.');         // Replace comma (decimal separator) with dot
    
    return parseFloat(cleanedText);
  }

  /**
   * Assert that the projected balance equals the expected amount
   */
  async expectBalanceAmount(expectedAmount: number): Promise<void> {
    const actualAmount = await this.getBalanceAmount();
    expect(actualAmount).toBeCloseTo(expectedAmount, 2);
  }
}

