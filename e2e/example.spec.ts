import { test, expect } from '@playwright/test';

/**
 * Example E2E test to verify Playwright setup
 * This test verifies that the app loads and displays correctly
 */
test('app loads and displays correctly', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Verify the page title or a key element is present
  // Adjust this selector based on your app's structure
  const body = page.locator('body');
  await expect(body).toBeVisible();

  // Verify the page has loaded (no console errors)
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Wait a bit to catch any console errors
  await page.waitForTimeout(1000);

  // Verify no critical errors occurred
  expect(errors.length).toBe(0);
});





