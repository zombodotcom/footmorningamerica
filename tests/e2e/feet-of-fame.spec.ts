import { test, expect } from '@playwright/test';

test('feet of fame page renders categories and ranked names', async ({ page }) => {
  await page.goto('/feet-of-fame');
  await expect(page.getByRole('heading', { level: 1, name: /feet of fame/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /hollywood/i })).toBeVisible();
  await expect(page.getByText(/emma stone/i).first()).toBeVisible();
});
