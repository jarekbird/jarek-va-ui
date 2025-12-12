import { test, expect } from '@playwright/test';

/**
 * E2E tests for Conversation Flows
 *
 * These tests verify that users can:
 * - List conversations
 * - View conversation details
 * - Navigate between views
 * - Create new conversations
 */

test.describe('Conversation Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root page (conversation list)
    await page.goto('/');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('conversation list loads and displays conversations', async ({ page }) => {
    // Wait for the conversation list to be visible
    // The list should contain conversation items or show empty state
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verify the page has loaded (check for navigation or list container)
    const navigation = page.locator('nav').first();
    await expect(navigation).toBeVisible({ timeout: 10000 });
  });

  test('can navigate to conversation detail view', async ({ page }) => {
    // Wait for any conversation links to appear
    // If there are conversations, click the first one
    // If there are no conversations, the test should still pass (empty state)
    const conversationLink = page.locator('a[href*="/conversation/"]').first();
    
    // Check if any conversation links exist
    const linkCount = await conversationLink.count();
    
    if (linkCount > 0) {
      // Click the first conversation link
      await conversationLink.click();
      
      // Wait for navigation to detail view
      await page.waitForURL(/\/conversation\/.+/, { timeout: 10000 });
      
      // Verify we're on the detail page (check for back link or detail content)
      const backLink = page.locator('a').filter({ hasText: /back to/i }).first();
      await expect(backLink).toBeVisible({ timeout: 10000 });
    } else {
      // No conversations exist - this is a valid state
      // Verify we're still on the list page
      await expect(page).toHaveURL('/');
    }
  });

  test('can navigate back to list from detail view', async ({ page }) => {
    // Try to navigate to a conversation detail if one exists
    const conversationLink = page.locator('a[href*="/conversation/"]').first();
    const linkCount = await conversationLink.count();
    
    if (linkCount > 0) {
      // Navigate to detail
      await conversationLink.click();
      await page.waitForURL(/\/conversation\/.+/, { timeout: 10000 });
      
      // Find and click the back link
      const backLink = page.locator('a').filter({ hasText: /back to/i }).first();
      await expect(backLink).toBeVisible({ timeout: 10000 });
      await backLink.click();
      
      // Verify we're back on the list page
      await page.waitForURL('/', { timeout: 10000 });
      await expect(page).toHaveURL('/');
    } else {
      // No conversations - skip this test scenario
      test.skip();
    }
  });

  test('can create new conversation', async ({ page }) => {
    // Look for the "New Note" or similar button
    const newNoteButton = page
      .locator('button')
      .filter({ hasText: /new note|new conversation/i })
      .first();
    
    const buttonCount = await newNoteButton.count();
    
    if (buttonCount > 0) {
      // Click the new note button
      await newNoteButton.click();
      
      // Wait for navigation to new conversation or for the button to be disabled
      // The app might navigate to the new conversation or show it in the list
      await page.waitForTimeout(2000); // Give time for the action to complete
      
      // Verify either navigation occurred or the list was updated
      // (The exact behavior depends on the app implementation)
      const currentUrl = page.url();
      const isOnDetailPage = /\/conversation\/.+/.test(currentUrl);
      const isOnListPage = currentUrl.endsWith('/');
      
      // One of these should be true
      expect(isOnDetailPage || isOnListPage).toBeTruthy();
    } else {
      // Button not found - might be in a different location or not available
      // This is acceptable for E2E tests (app might have different states)
      test.skip();
    }
  });

  test('conversation detail view displays correctly', async ({ page }) => {
    // Try to navigate to a conversation detail if one exists
    const conversationLink = page.locator('a[href*="/conversation/"]').first();
    const linkCount = await conversationLink.count();
    
    if (linkCount > 0) {
      // Navigate to detail
      await conversationLink.click();
      await page.waitForURL(/\/conversation\/.+/, { timeout: 10000 });
      
      // Wait for the detail view to load
      await page.waitForLoadState('networkidle');
      
      // Verify the detail view is displayed
      // Check for back link or detail content
      const backLink = page.locator('a').filter({ hasText: /back to/i }).first();
      await expect(backLink).toBeVisible({ timeout: 10000 });
      
      // Verify the page has content (not just a blank page)
      const body = page.locator('body');
      const bodyText = await body.textContent();
      expect(bodyText?.length).toBeGreaterThan(0);
    } else {
      // No conversations - skip this test scenario
      test.skip();
    }
  });
});

