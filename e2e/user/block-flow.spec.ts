import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';

// PDFテストケース② No.109-117 (UC20804 アカウントをブロックする)
// PDFテストケース② No.131-133 (UC20805 アカウントをブロック解除する)
// ブロック時・ブロック解除時にフラッシュメッセージが表示されることを確認する。
test.describe('ブロック機能のフラッシュメッセージ', () => {
  test('他ユーザーのプロフィールからブロックするとフラッシュメッセージが表示される', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await page.goto('/home');
    await dismissTermsConsentModalIfPresent(page);

    // 検索でtaro01を探す
    await page.goto('/search');
    await page.getByPlaceholder('search').fill('taro');
    await page.getByPlaceholder('search').press('Enter');
    await expect(page.getByText('taro01').first()).toBeVisible({ timeout: 5000 });

    // taro01のユーザー詳細に移動
    await page.getByText('taro01').first().click();
    await expect(page).toHaveURL(/\/users\/.+/);

    // ページ上部のメニューボタン（プロフィールページのもの）= topBarにあるメニューボタン
    await page.locator('[class*="topBar"] button[aria-label="メニュー"]').click();
    await page.getByRole('button', { name: 'ブロック' }).click();

    // フラッシュメッセージ「ユーザーをブロックしました」が表示される
    await expect(page.getByText('ユーザーをブロックしました')).toBeVisible({ timeout: 5000 });

    // ブロック解除
    await page.locator('[class*="topBar"] button[aria-label="メニュー"]').click();
    await page.getByRole('button', { name: 'ブロック解除' }).click();

    // フラッシュメッセージ「ブロックを解除しました」が表示される
    await expect(page.getByText('ブロックを解除しました')).toBeVisible({ timeout: 5000 });
  });
});
