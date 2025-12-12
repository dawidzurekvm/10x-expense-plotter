import type { Page, Locator } from '@playwright/test';

/**
 * Base Page Object class providing common functionality for all page objects.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Get a locator by data-testid attribute
   */
  protected getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to a specific URL path
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }
}

