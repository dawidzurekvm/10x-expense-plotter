import { test } from '@playwright/test';
import { DashboardPage } from './pages';

test.describe.serial('Onboarding', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
  });

  test('should complete starting balance onboarding and verify projected balance', async () => {
    const startingAmount = 1234.56;
    const effectiveDate = '2025-12-01';

    // Step 1: Go to main page
    await dashboardPage.goto();

    // Step 2: Expect onboarding modal to show up
    await dashboardPage.onboardingModal.waitForVisible();
    await dashboardPage.onboardingModal.expectVisible();

    // Step 3: Set 1234,56 as starting amount
    await dashboardPage.onboardingModal.fillAmount(startingAmount);

    // Step 4: Set December 1st, 2025 as effective date
    await dashboardPage.onboardingModal.fillDate(effectiveDate);

    // Step 5: Click "Set Starting Balance"
    await dashboardPage.onboardingModal.clickSubmit();

    // Step 6: Wait for modal to disappear
    await dashboardPage.onboardingModal.waitForHidden();

    // Step 7: Expect Projected Balance to show the starting amount
    // Format can be "1234,56 zł" or "1 234,56 zł" depending on locale
    await dashboardPage.projectionPanel.waitForBalanceLoaded();
    await dashboardPage.projectionPanel.expectBalanceToContain('1234,56');
    await dashboardPage.projectionPanel.expectBalanceToContain('zł');
  });
});

