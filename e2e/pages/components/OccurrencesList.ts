import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Component Object for the Occurrences List.
 * Provides methods to interact with and verify the list of entries.
 */
export class OccurrencesList {
  readonly list: Locator;
  readonly emptyState: Locator;

  constructor(private readonly page: Page) {
    this.list = page.getByTestId('occurrences-list');
    this.emptyState = page.getByTestId('occurrences-empty');
  }

  /**
   * Get all occurrence cards in the list
   */
  getAllCards(): Locator {
    return this.page.getByTestId('occurrence-card');
  }

  /**
   * Get the count of occurrence cards
   */
  async getCardCount(): Promise<number> {
    return await this.getAllCards().count();
  }

  /**
   * Find an occurrence card by its title
   */
  getCardByTitle(title: string): Locator {
    return this.page
      .getByTestId('occurrence-card')
      .filter({ has: this.page.getByTestId('occurrence-title').getByText(title, { exact: true }) });
  }

  /**
   * Check if an entry with the given title exists in the list
   */
  async hasEntryWithTitle(title: string): Promise<boolean> {
    const card = this.getCardByTitle(title);
    return await card.count() > 0;
  }

  /**
   * Wait for an entry with the given title to appear in the list
   * Note: For recurring entries, there may be multiple occurrences - this checks for at least one
   */
  async waitForEntryWithTitle(title: string, timeout?: number): Promise<void> {
    await expect(this.getCardByTitle(title).first()).toBeVisible({ timeout });
  }

  /**
   * Assert that the list is visible
   */
  async expectVisible(): Promise<void> {
    await expect(this.list).toBeVisible();
  }

  /**
   * Assert that the empty state is visible
   */
  async expectEmpty(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * Assert that the list contains a specific number of entries
   */
  async expectCardCount(count: number): Promise<void> {
    await expect(this.getAllCards()).toHaveCount(count);
  }

  /**
   * Assert that an entry with the given title exists
   * Note: For recurring entries, there may be multiple occurrences - this checks for at least one
   */
  async expectEntryWithTitle(title: string): Promise<void> {
    await expect(this.getCardByTitle(title).first()).toBeVisible();
  }

  /**
   * Assert that an entry with the given title does not exist
   */
  async expectNoEntryWithTitle(title: string): Promise<void> {
    await expect(this.getCardByTitle(title)).not.toBeVisible();
  }
}

