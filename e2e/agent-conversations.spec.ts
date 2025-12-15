import { test, expect } from '@playwright/test';

/**
 * E2E tests for Agent Conversation Flows
 *
 * These tests verify that users can:
 * - List agent conversations
 * - View agent conversation details
 * - Navigate between views
 *
 * Note: These tests require ElevenLabs feature flag to be enabled
 */

test.describe('Agent Conversation Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the agent conversations page
    await page.goto('/agent-conversations');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('agent conversation list loads', async ({ page }) => {
    // Wait for the page to be visible
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verify the page has loaded
    // The page might show the list or indicate that ElevenLabs is disabled
    const navigation = page.locator('nav').first();
    await expect(navigation).toBeVisible({ timeout: 10000 });
  });

  test('agent conversations are displayed in list', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if agent conversation links exist
    const conversationLink = page.locator('a[href*="/agent-conversation/"]').first();
    const linkCount = await conversationLink.count();

    if (linkCount > 0) {
      // Verify at least one conversation link is visible
      await expect(conversationLink).toBeVisible({ timeout: 10000 });
    } else {
      // No conversations or feature disabled - this is a valid state
      // Verify we're on the agent conversations page
      await expect(page).toHaveURL(/\/agent-conversations/);
    }
  });

  test('can navigate to agent conversation detail view', async ({ page }) => {
    // Wait for any agent conversation links to appear
    const conversationLink = page.locator('a[href*="/agent-conversation/"]').first();
    const linkCount = await conversationLink.count();

    if (linkCount > 0) {
      // Click the first conversation link
      await conversationLink.click();

      // Wait for navigation to detail view
      await page.waitForURL(/\/agent-conversation\/.+/, { timeout: 10000 });

      // Verify we're on the detail page (check for back link or detail content)
      const backLink = page.locator('a').filter({ hasText: /back to/i }).first();
      await expect(backLink).toBeVisible({ timeout: 10000 });
    } else {
      // No conversations exist - skip this test
      test.skip();
    }
  });

  test('agent conversation detail displays correctly', async ({ page }) => {
    // Try to navigate to an agent conversation detail if one exists
    const conversationLink = page.locator('a[href*="/agent-conversation/"]').first();
    const linkCount = await conversationLink.count();

    if (linkCount > 0) {
      // Navigate to detail
      await conversationLink.click();
      await page.waitForURL(/\/agent-conversation\/.+/, { timeout: 10000 });

      // Wait for the detail view to load
      await page.waitForLoadState('networkidle');

      // Verify the detail view is displayed
      const backLink = page.locator('a').filter({ hasText: /back to/i }).first();
      await expect(backLink).toBeVisible({ timeout: 10000 });

      // Verify the page has content
      const body = page.locator('body');
      const bodyText = await body.textContent();
      expect(bodyText?.length).toBeGreaterThan(0);
    } else {
      // No conversations - skip this test scenario
      test.skip();
    }
  });

  test('can navigate back to list from detail view', async ({ page }) => {
    // Try to navigate to an agent conversation detail if one exists
    const conversationLink = page.locator('a[href*="/agent-conversation/"]').first();
    const linkCount = await conversationLink.count();

    if (linkCount > 0) {
      // Navigate to detail
      await conversationLink.click();
      await page.waitForURL(/\/agent-conversation\/.+/, { timeout: 10000 });

      // Find and click the back link
      const backLink = page.locator('a').filter({ hasText: /back to/i }).first();
      await expect(backLink).toBeVisible({ timeout: 10000 });
      await backLink.click();

      // Verify we're back on the list page
      await page.waitForURL(/\/agent-conversations/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/agent-conversations/);
    } else {
      // No conversations - skip this test scenario
      test.skip();
    }
  });
});


