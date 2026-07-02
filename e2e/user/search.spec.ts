import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';

test('ユーザー検索で存在しないキーワードは空表示になる', async ({ page }) => {
  await page.goto('/search');
  await dismissTermsConsentModalIfPresent(page);

  const query = `存在しないはずのユーザー名${Date.now()}`;
  await page.getByPlaceholder('search').fill(query);
  await page.getByPlaceholder('search').press('Enter');

  await expect(page.getByText('該当するユーザーが見つかりませんでした')).toBeVisible();
});
