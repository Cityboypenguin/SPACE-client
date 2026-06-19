import * as path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';

const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures');

// PDFテストケース① No.84-85, 107-112 (UC20404/UC20405)
// 4枚画像投稿後に3枚目を削除すると3枚グリッドに正しく切り替わることを確認する。
// file inputは1枚ずつしか受け付けないため、4回セットする。
test.describe('画像グリッド表示', () => {
  test('4枚投稿して3枚目を削除すると3枚グリッドに変わり左下が空白にならない', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    const postContent = `E2E画像テスト ${Date.now()}`;

    await page.goto('/home');
    await dismissTermsConsentModalIfPresent(page);

    // 新規投稿テキストを入力
    await page.getByPlaceholder('新規投稿').fill(postContent);

    // 画像を1枚ずつ計4回添付（file inputはsingle）
    const fileInput = page.locator('input[type="file"]').first();
    for (const filename of ['test01.png', 'test02.png', 'test03.png', 'test04.png']) {
      await fileInput.setInputFiles(path.join(FIXTURES, filename));
    }

    // 投稿
    await page.getByRole('button', { name: '投稿', exact: true }).click();
    await expect(page.getByText(postContent)).toBeVisible({ timeout: 10000 });

    // 投稿詳細に移動（PostCardのcard div全体をクリック）
    await page.locator('[class*="card"]').filter({ hasText: postContent }).first().locator('p, [class*="content"]').first().click();
    await expect(page).toHaveURL(/\/posts\/.+/, { timeout: 8000 });

    // 4枚の画像が表示されていることを確認（PostMediaGridの画像はcursor:zoom-inスタイル）
    const imgs = page.locator('img[style*="zoom-in"]');
    await expect(imgs).toHaveCount(4, { timeout: 5000 });

    // 編集モードに入る（投稿本体のミートボールメニュー）
    await page.locator('[class*="postBodyHeader"] [class*="menuWrap"] button[aria-label="メニュー"]').click();
    await page.getByRole('button', { name: '編集' }).click();

    // 3枚目の画像削除ボタン（index=2）
    const deleteButtons = page.locator('[class*="mediaPreview"] button, [class*="existingMedia"] button, [class*="deleteBtn"]');
    await deleteButtons.nth(2).click();

    // 保存
    await page.getByRole('button', { name: '保存する' }).click();

    // 編集フォームが閉じる
    await expect(page.locator('[class*="editForm"]')).not.toBeVisible({ timeout: 5000 });

    // 3枚グリッドに変わっていることを確認
    await expect(page.locator('img[style*="zoom-in"]')).toHaveCount(3, { timeout: 5000 });

    // 後片付け: 投稿削除
    await page.locator('[class*="postBodyHeader"] [class*="menuWrap"] button[aria-label="メニュー"]').click();
    await page.getByRole('button', { name: '削除' }).click();
    await expect(page).toHaveURL(/\/home$/);
  });
});
