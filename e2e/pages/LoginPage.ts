import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Login page.
 * Handles user authentication flow.
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = this.getByTestId('login-email-input');
    this.passwordInput = this.getByTestId('login-password-input');
    this.submitButton = this.getByTestId('login-submit-button');
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await super.goto('/login');
  }

  /**
   * Fill in email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Fill in password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Click the Sign In button
   */
  async clickSignIn(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Perform full login flow
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
  }

  /**
   * Login and wait for redirect to dashboard
   */
  async loginAndWaitForDashboard(email: string, password: string): Promise<void> {
    await this.login(email, password);
    await this.page.waitForURL('/', { timeout: 30000 });
  }

  /**
   * Assert that the login form is visible
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}

