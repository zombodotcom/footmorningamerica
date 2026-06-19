import { test, expect } from '@playwright/test';

test('news index lists posts and a post page renders', async ({ page }) => {
  await page.goto('/news');
  await expect(page.getByRole('heading', { name: /foot news/i })).toBeVisible();
  const firstPost = page.getByRole('link', { name: /welcome to foot morning america/i });
  await expect(firstPost).toBeVisible();
  await firstPost.click();
  await expect(page.getByRole('heading', { level: 1, name: /welcome to foot morning america/i })).toBeVisible();
  await expect(page.getByText(/welcome aboard/i)).toBeVisible();
});
