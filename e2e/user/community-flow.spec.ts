import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';

test('コミュニティを作成すると一覧に表示され、チャットルームを開ける', async ({ page }) => {
  const communityName = `E2Eコミュニティ ${Date.now()}`;

  await page.goto('/community/create');
  await dismissTermsConsentModalIfPresent(page);

  await page.locator('input[type="text"]').fill(communityName);
  await page.locator('textarea').fill('E2Eテストで作成したコミュニティです。');
  await page.getByRole('button', { name: '作成する' }).click();

  await expect(page).toHaveURL(/\/community$/);
  await expect(page.getByText(communityName)).toBeVisible();

  await page.getByText(communityName).click();
  await expect(page).toHaveURL(/\/community\/chat\/.+/);
  await expect(page.getByText(communityName).first()).toBeVisible();
  await expect(page.getByPlaceholder(/メッセージを入力/)).toBeVisible();
});
