import { test, expect } from '@playwright/test';

test('404 page renders for unknown routes', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible();
  await expect(page.getByText(/cold feet/i)).toBeVisible();
});

test('legal pages render', async ({ page }) => {
  await page.goto('/legal/privacy');
  await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
  await page.goto('/legal/dmca');
  await expect(page.getByRole('heading', { name: /content & removal/i })).toBeVisible();
});
