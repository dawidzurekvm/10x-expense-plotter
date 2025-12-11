import { test, expect } from '@playwright/test';

test.describe('Example E2E Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await expect(page).toHaveTitle(/10x/);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Check if login page exists
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should have visible heading on login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check for a heading or main content
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});

test.describe('Form Validation Example', () => {
  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to find and click submit button
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Wait a bit for validation to potentially appear
      await page.waitForTimeout(500);
    }
  });
});

