import { test, expect } from '@playwright/test';

test('directory shows approved listings with affiliate-tagged links', async ({ page }) => {
  await page.goto('/directory');
  await page.getByRole('button', { name: /i am 18/i }).click();
  const card = page.getByTestId('creator-card').first();
  await expect(card).toBeVisible();
  const link = card.getByRole('link', { name: /view/i });
  await expect(link).toHaveAttribute('href', /utm_source=footmorningamerica/);
});
