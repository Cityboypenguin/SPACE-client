import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';

// PDFテストケース② No.61-69 (UC20601 管理者に問い合わせる)
// PDFテストケース③ No.72-79
test.describe('お問い合わせ機能', () => {
  test('設定画面からお問い合わせを送信すると完了ポップアップが表示され、戻るで初期状態に戻る', async ({ page }) => {
    await page.goto('/mypage/settings');
    await dismissTermsConsentModalIfPresent(page);

    // お問い合わせメニューを押す
    await page.getByRole('button', { name: 'お問い合わせ' }).click();

    // カテゴリ「DMに関して」を選択
    await page.getByLabel('DMに関して').click();

    // 氏名・メールアドレス・本文を入力（placeholderは"Value"）
    await page.getByPlaceholder('Value').first().fill('テスト太郎');
    await page.getByPlaceholder('Value').nth(1).fill('taro@example.com');
    await page.getByPlaceholder('詳細を入力してください').fill('E2Eテスト問い合わせ');

    // 送信（ボタンラベルは「送信」）
    await page.getByRole('button', { name: '送信', exact: true }).click();

    // 送信完了ポップアップが表示される
    await expect(page.getByText('送信が完了しました')).toBeVisible({ timeout: 5000 });

    // 戻るボタンを押すと設定の初期状態に戻る
    await page.getByRole('button', { name: '戻る' }).click();
    await expect(page.getByText('送信が完了しました')).not.toBeVisible();
    // お問い合わせフォームが非表示になる（設定メニュー画面に戻った）
    await expect(page.getByRole('button', { name: 'お問い合わせ' })).toBeVisible();
  });

  test('「その他」カテゴリで件名なしだと送信できない', async ({ page }) => {
    await page.goto('/inquiry');
    await dismissTermsConsentModalIfPresent(page);

    // カテゴリ「その他のお問い合わせ」を選択
    await page.getByLabel('その他のお問い合わせ').click();

    // 氏名・メールアドレス・本文のみ入力（件名は空欄のまま）
    await page.getByPlaceholder('Value').first().fill('テスト太郎');
    await page.getByPlaceholder('Value').nth(1).fill('taro@example.com');
    await page.getByPlaceholder('詳細を入力してください').fill('テスト');

    // 件名が必須 (required) なので送信ボタンを押しても完了にならない
    await page.getByRole('button', { name: '送信', exact: true }).click();
    await expect(page.getByText('送信が完了しました')).not.toBeVisible();
  });

  test('間違ったメールアドレス形式だと送信ボタンが無効になる', async ({ page }) => {
    await page.goto('/inquiry');
    await dismissTermsConsentModalIfPresent(page);

    await page.getByLabel('DMに関して').click();
    await page.getByPlaceholder('Value').first().fill('テスト太郎');
    // 不正なメールアドレス（a@a 形式 — ドット無しでREGEXに引っかかる）
    await page.getByPlaceholder('Value').nth(1).fill('taro');
    await page.getByPlaceholder('詳細を入力してください').fill('テスト');

    // メールアドレス形式エラーが表示され、送信ボタンが無効
    await expect(page.getByText('メールアドレスの形式が正しくありません')).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: '送信', exact: true })).toBeDisabled();
  });
});
