import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages';
import { generateUniqueEntryTitle } from './utils/test-data';

test.describe.serial('Entry Management', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    // Authentication is handled by auth.setup.ts - user is already logged in
    
    // Navigate to dashboard
    await dashboardPage.goto();
    
    // Handle onboarding modal if it appears (in case starting balance doesn't exist)
    const onboardingVisible = await dashboardPage.onboardingModal.isVisible();
    if (onboardingVisible) {
      await dashboardPage.onboardingModal.fillAmount(1000);
      await dashboardPage.onboardingModal.fillDate('2025-01-01');
      await dashboardPage.onboardingModal.clickSubmit();
      await dashboardPage.onboardingModal.waitForHidden();
    }
  });

  test.describe('Add Entry Dialog', () => {
    test('should open Add Entry dialog when clicking Add Entry button', async () => {
      // Navigation and onboarding handled in beforeEach
      await dashboardPage.expectAddEntryButtonVisible();

      const entryDialog = await dashboardPage.clickAddEntry();
      await entryDialog.expectAddMode();
    });

    test('should create a new monthly expense entry and verify it appears in the list', async () => {
      const uniqueTitle = generateUniqueEntryTitle('Monthly Expense');

      // Step 1: Click Add Entry button
      const entryDialog = await dashboardPage.clickAddEntry();

      // Step 2: Verify dialog is open
      await entryDialog.waitForOpen();
      await entryDialog.expectAddMode();

      // Step 3: Fill Title with unique name
      await entryDialog.fillTitle(uniqueTitle);

      // Step 4: Fill Amount
      await entryDialog.fillAmount(3.15);

      // Step 5: Set Recurrence to Monthly
      await entryDialog.selectRecurrence('monthly');

      // Step 6: Click Save
      await entryDialog.clickSave();

      // Step 7: Verify dialog closes after successful save
      await entryDialog.waitForClose();

      // Step 8: Verify the entry appears in the list
      await dashboardPage.occurrencesList.waitForEntryWithTitle(uniqueTitle);
      await dashboardPage.occurrencesList.expectEntryWithTitle(uniqueTitle);
    });

    test('should create a new one-time expense entry and verify it appears in the list', async () => {
      const uniqueTitle = generateUniqueEntryTitle('One-time Expense');

      const entryDialog = await dashboardPage.clickAddEntry();

      await entryDialog.submitForm({
        title: uniqueTitle,
        amount: 29.99,
        recurrence: 'one_time',
      });

      await entryDialog.waitForClose();

      // Verify entry was added to the list
      await dashboardPage.occurrencesList.waitForEntryWithTitle(uniqueTitle);
      await dashboardPage.occurrencesList.expectEntryWithTitle(uniqueTitle);
    });

    test('should create multiple entries with various types and verify projection', async () => {
      // Create 4 entries with mix of income/expense and recurrence types
      // All starting in first week of December 2025
      const entries = [
        {
          title: generateUniqueEntryTitle('Monthly Rent'),
          amount: 1200,
          entryType: 'expense' as const,
          recurrence: 'monthly' as const,
          startDate: '2025-12-01',
        },
        {
          title: generateUniqueEntryTitle('Weekly Freelance'),
          amount: 500,
          entryType: 'income' as const,
          recurrence: 'weekly' as const,
          startDate: '2025-12-03',
        },
        {
          title: generateUniqueEntryTitle('One-time Bonus'),
          amount: 2000,
          entryType: 'income' as const,
          recurrence: 'one_time' as const,
          startDate: '2025-12-05',
        },
        {
          title: generateUniqueEntryTitle('Monthly Subscription'),
          amount: 15,
          entryType: 'expense' as const,
          recurrence: 'monthly' as const,
          startDate: '2025-12-07',
        },
      ];

      // First, set the projection date to end of March 2026
      // This ensures we capture the baseline at the same target date
      await dashboardPage.projectionPanel.waitForBalanceLoaded();
      await dashboardPage.projectionPanel.setProjectionDate('2026-03-31');
      await dashboardPage.projectionPanel.waitForBalanceUpdate();
      
      // Get initial projected balance at March 31, 2026 BEFORE adding entries
      const initialBalance = await dashboardPage.projectionPanel.getBalanceAmount();

      // Create all entries
      for (const entry of entries) {
        const entryDialog = await dashboardPage.clickAddEntry();
        await entryDialog.submitForm(entry);
        await entryDialog.waitForClose();
        await dashboardPage.occurrencesList.waitForEntryWithTitle(entry.title);
      }

      // Verify all entries exist in the list
      for (const entry of entries) {
        await dashboardPage.occurrencesList.expectEntryWithTitle(entry.title);
      }

      // Wait for projection to update after adding all entries
      await dashboardPage.projectionPanel.waitForBalanceUpdate();

      // Calculate expected balance change from Dec 1, 2025 to March 31, 2026
      // Monthly Rent (expense): 4 months (Dec, Jan, Feb, Mar) = 4 * 1200 = -4800
      // Weekly Freelance (income): ~17 weeks from Dec 3 to Mar 31 = 17 * 500 = +8500
      // One-time Bonus (income): 1 * 2000 = +2000
      // Monthly Subscription (expense): 4 months = 4 * 15 = -60
      // Net change: -4800 + 8500 + 2000 - 60 = +5640

      const expectedChange = -4800 + 8500 + 2000 - 60; // = 5640
      const expectedBalance = initialBalance + expectedChange;

      // Verify the projected balance is approximately correct
      // Using a tolerance of $600 to account for slight variations in week counting
      const actualBalance = await dashboardPage.projectionPanel.getBalanceAmount();
      expect(actualBalance).toBeGreaterThan(expectedBalance - 600);
      expect(actualBalance).toBeLessThan(expectedBalance + 600);
    });
  });

  test.describe('Entry Form Validation', () => {
    test('should have save button enabled with valid data', async () => {
      const uniqueTitle = generateUniqueEntryTitle('Validation Test');

      const entryDialog = await dashboardPage.clickAddEntry();
      await entryDialog.fillTitle(uniqueTitle);
      await entryDialog.fillAmount(100);

      await entryDialog.expectSaveEnabled();
    });
  });
});
