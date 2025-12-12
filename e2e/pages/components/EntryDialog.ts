import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export type RecurrenceType = 'one_time' | 'weekly' | 'monthly' | 'yearly';
export type EntryType = 'income' | 'expense';

export interface EntryFormData {
  title: string;
  amount: number;
  recurrence?: RecurrenceType;
  entryType?: EntryType;
  startDate?: string; // Format: 'YYYY-MM-DD'
  description?: string;
}

/**
 * Component Object for the Add/Edit Entry Dialog.
 * Encapsulates all interactions with the entry form dialog.
 */
export class EntryDialog {
  // Dialog container
  readonly dialog: Locator;

  // Form inputs
  readonly titleInput: Locator;
  readonly amountInput: Locator;
  readonly recurrenceSelect: Locator;
  readonly saveButton: Locator;
  readonly startDateButton: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByTestId('entry-dialog');
    this.titleInput = page.getByTestId('entry-title-input');
    this.amountInput = page.getByTestId('entry-amount-input');
    this.recurrenceSelect = page.getByTestId('entry-recurrence-select');
    this.saveButton = page.getByTestId('entry-save-button');
    this.startDateButton = page.getByTestId('entry-start-date-button');
  }

  /**
   * Wait for the dialog to be visible
   */
  async waitForOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  /**
   * Wait for the dialog to be closed
   */
  async waitForClose(): Promise<void> {
    await expect(this.dialog).not.toBeVisible();
  }

  /**
   * Fill in the title field
   */
  async fillTitle(title: string): Promise<void> {
    await this.titleInput.fill(title);
  }

  /**
   * Fill in the amount field
   */
  async fillAmount(amount: number): Promise<void> {
    await this.amountInput.fill(amount.toString());
  }

  /**
   * Select a recurrence type from the dropdown
   */
  async selectRecurrence(recurrence: RecurrenceType): Promise<void> {
    await this.recurrenceSelect.click();
    await this.page.getByTestId(`recurrence-option-${recurrence}`).click();
  }

  /**
   * Get the recurrence option locator
   */
  getRecurrenceOption(recurrence: RecurrenceType): Locator {
    return this.page.getByTestId(`recurrence-option-${recurrence}`);
  }

  /**
   * Select the entry type (income or expense)
   */
  async selectEntryType(entryType: EntryType): Promise<void> {
    await this.page.getByTestId(`entry-type-${entryType}`).click();
  }

  /**
   * Select a start date using the calendar picker
   * @param dateString Format: 'YYYY-MM-DD'
   */
  async selectStartDate(dateString: string): Promise<void> {
    // Parse the date string
    const [year, month, day] = dateString.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    
    // Open the date picker
    await this.startDateButton.click();
    
    // Wait for calendar popover to be visible
    const popover = this.page.getByTestId('entry-start-date-popover');
    await expect(popover).toBeVisible();
    
    // Navigate to correct month/year
    // The target format: "December 2025"
    const targetMonthYear = targetDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    // Navigation buttons have rdp-button_previous and rdp-button_next classes
    const nextButton = popover.locator('.rdp-button_next');
    const prevButton = popover.locator('.rdp-button_previous');
    
    // Navigate months
    const maxAttempts = 24; // 2 years max navigation
    for (let i = 0; i < maxAttempts; i++) {
      // Check if we're on the right month by looking at the calendar caption
      const calendarText = await popover.textContent();
      
      if (calendarText?.includes(targetMonthYear)) {
        break;
      }
      
      // Determine direction - check if we need to go forward or backward
      const now = new Date();
      if (targetDate > now) {
        await nextButton.click();
      } else {
        await prevButton.click();
      }
      
      // Small delay for calendar to update
      await this.page.waitForTimeout(100);
    }
    
    // Click the day by finding the button with the day number
    // The calendar renders days as buttons inside table cells (td)
    // We need to find the button in a cell that's not marked as "outside" (previous/next month)
    // and contains the day number
    const dayButtons = popover.locator('td:not([data-outside="true"]) button');
    const dayButton = dayButtons.filter({ hasText: new RegExp(`^${day}$`) });
    await dayButton.click();
  }

  /**
   * Click the Save Entry button
   */
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Fill the entire form with provided data
   */
  async fillForm(data: EntryFormData): Promise<void> {
    if (data.entryType) {
      await this.selectEntryType(data.entryType);
    }
    
    await this.fillTitle(data.title);
    await this.fillAmount(data.amount);

    if (data.startDate) {
      await this.selectStartDate(data.startDate);
    }

    if (data.recurrence) {
      await this.selectRecurrence(data.recurrence);
    }
  }

  /**
   * Fill the form and submit it
   */
  async submitForm(data: EntryFormData): Promise<void> {
    await this.fillForm(data);
    await this.clickSave();
  }

  /**
   * Assert that the dialog title shows "Add New Entry"
   */
  async expectAddMode(): Promise<void> {
    await expect(this.dialog.getByText('Add New Entry')).toBeVisible();
  }

  /**
   * Assert that the dialog title shows "Edit Entry"
   */
  async expectEditMode(): Promise<void> {
    await expect(this.dialog.getByText('Edit Entry')).toBeVisible();
  }

  /**
   * Assert that the save button is enabled
   */
  async expectSaveEnabled(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
  }

  /**
   * Assert that the save button is disabled
   */
  async expectSaveDisabled(): Promise<void> {
    await expect(this.saveButton).toBeDisabled();
  }

  /**
   * Assert that the save button shows "Saving..." text
   */
  async expectSaving(): Promise<void> {
    await expect(this.saveButton).toHaveText('Saving...');
  }
}
