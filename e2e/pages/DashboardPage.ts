import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { EntryDialog } from './components/EntryDialog';
import { OccurrencesList } from './components/OccurrencesList';
import { OnboardingModal } from './components/OnboardingModal';
import { ProjectionPanel } from './components/ProjectionPanel';

/**
 * Page Object for the Dashboard page.
 * Provides access to dashboard toolbar actions and entry management.
 */
export class DashboardPage extends BasePage {
  // Toolbar elements
  readonly addEntryButton: Locator;

  // Components
  readonly entryDialog: EntryDialog;
  readonly occurrencesList: OccurrencesList;
  readonly onboardingModal: OnboardingModal;
  readonly projectionPanel: ProjectionPanel;

  constructor(page: Page) {
    super(page);
    this.addEntryButton = this.getByTestId('add-entry-button');
    this.entryDialog = new EntryDialog(page);
    this.occurrencesList = new OccurrencesList(page);
    this.onboardingModal = new OnboardingModal(page);
    this.projectionPanel = new ProjectionPanel(page);
  }

  /**
   * Navigate to the dashboard page
   */
  async goto(): Promise<void> {
    await super.goto('/');
  }

  /**
   * Click the Add Entry button to open the entry dialog
   */
  async clickAddEntry(): Promise<EntryDialog> {
    await this.addEntryButton.click();
    await this.entryDialog.waitForOpen();
    return this.entryDialog;
  }

  /**
   * Assert that the Add Entry button is visible
   */
  async expectAddEntryButtonVisible(): Promise<void> {
    await expect(this.addEntryButton).toBeVisible();
  }
}

