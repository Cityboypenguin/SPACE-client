import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';

test.describe('投稿の作成・返信・いいね・削除', () => {
  test('投稿を作成し、返信・いいね・削除まで一通り行える', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    const postContent = `E2Eテスト投稿 ${Date.now()}`;
    const replyContent = `E2Eテスト返信 ${Date.now()}`;

    await page.goto('/home');
    await dismissTermsConsentModalIfPresent(page);

    await page.getByPlaceholder('新規投稿').fill(postContent);
    await page.getByRole('button', { name: '投稿', exact: true }).click();
    await expect(page.getByText(postContent)).toBeVisible();

    await page.getByText(postContent).click();
    await expect(page).toHaveURL(/\/posts\/.+/);
    await expect(page.getByRole('heading', { name: '投稿' })).toBeVisible();

    await page.getByPlaceholder('返信する...').fill(replyContent);
    await page.getByRole('button', { name: '返信する' }).click();
    await expect(page.getByText(replyContent)).toBeVisible();

    await page.getByRole('button', { name: 'いいね' }).click();
    await expect(page.getByRole('button', { name: 'いいね' })).toBeEnabled();

    await page.getByRole('button', { name: 'メニュー' }).click();
    await page.getByRole('button', { name: '削除' }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText(postContent)).toHaveCount(0);
  });
});
