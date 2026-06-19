import { test, expect } from '@playwright/test';

test('age gate blocks until confirmed, then persists', async ({ page }) => {
  await page.goto('/directory');
  await expect(page.getByTestId('age-gate')).toBeVisible();
  await page.getByRole('button', { name: /i am 18/i }).click();
  await expect(page.getByTestId('age-gate')).toBeHidden();
  await page.reload();
  await expect(page.getByTestId('age-gate')).toBeHidden();
});
