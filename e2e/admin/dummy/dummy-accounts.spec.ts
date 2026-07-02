import { test, expect } from '@playwright/test';
import { getAdminTokenFromPage, deleteDummyUser } from '../../support/adminApi';
import { env } from '../../support/env';
import { waitForSuccessfulGraphQL } from '../../support/graphqlResponse';

// ダミーアカウント作成UIのテスト。
// UIからフォームを操作→作成→一覧に反映→APIで後片付けの順で行う。

test('ダミーアカウントをUIから作成でき、ユーザー一覧に反映される', async ({ page, request, baseURL }) => {
  const base = baseURL ?? env.baseURL;
  const suffix = Date.now();
  const input = {
    accountID: `dummy_ui_${suffix}`,
    name: `UIダミー${suffix}`,
    email: `dummy_ui_${suffix}@example.com`,
    password: 'E2ePassword1!',
  };

  let createdUserID: string | null = null;

  await page.goto('/admin/users');
  await expect(page.getByRole('heading', { name: 'ユーザー一覧' })).toBeVisible();

  // ダミーアカウント作成モーダルを開く
  await page.getByRole('button', { name: 'ダミーアカウント作成' }).click();
  await expect(page.getByRole('heading', { name: 'ダミーアカウント作成' })).toBeVisible();

  // フォームに入力（labelにhtmlForがないためinput[required]で順番に取得）
  await page.locator('input[required]').nth(0).fill(input.accountID);
  await page.locator('input[required]').nth(1).fill(input.name);
  await page.locator('input[required]').nth(2).fill(input.email);
  await page.locator('input[required]').nth(3).fill(input.password);

  // 作成ボタンを押してモーダルが閉じるのを待つ
  await Promise.all([
    waitForSuccessfulGraphQL(page, 'AdminCreateUser'),
    page.getByRole('button', { name: '作成', exact: true }).click(),
  ]);
  await expect(page.getByRole('heading', { name: 'ダミーアカウント作成' })).not.toBeVisible({ timeout: 10000 });

  // 作成されたユーザーが一覧に表示される（検索で絞り込む）
  await page.locator('input[placeholder="名前で検索"]').fill(input.name);
  await page.getByRole('button', { name: '検索' }).click();
  const createdRow = page.getByRole('row').filter({ hasText: input.accountID });
  await expect(createdRow).toContainText(input.email, { timeout: 10000 });

  // ユーザー詳細ページに遷移してIDを取得する
  await createdRow.getByText(input.accountID, { exact: true }).click();
  const url = page.url();
  const match = url.match(/\/admin\/users\/(.+)/);
  if (match) createdUserID = match[1];

  // 後片付け: 作成したアカウントを削除
  if (createdUserID) {
    const adminToken = await getAdminTokenFromPage(page);
    await deleteDummyUser(request, base, adminToken, createdUserID);
  }
});

test('必須項目が未入力の場合、エラーが表示される', async ({ page }) => {
  await page.goto('/admin/users');
  await page.getByRole('button', { name: 'ダミーアカウント作成' }).click();
  await expect(page.getByRole('heading', { name: 'ダミーアカウント作成' })).toBeVisible();

  // 何も入力せずに送信
  await page.getByRole('button', { name: '作成', exact: true }).click();

  // ブラウザのネイティブバリデーションか、フォームエラーが表示される
  // （モーダルが閉じないことで確認）
  await expect(page.getByRole('heading', { name: 'ダミーアカウント作成' })).toBeVisible();
});

test('キャンセルボタンでモーダルを閉じられる', async ({ page }) => {
  await page.goto('/admin/users');
  await page.getByRole('button', { name: 'ダミーアカウント作成' }).click();
  await expect(page.getByRole('heading', { name: 'ダミーアカウント作成' })).toBeVisible();

  await page.getByRole('button', { name: 'キャンセル' }).click();
  await expect(page.getByRole('heading', { name: 'ダミーアカウント作成' })).not.toBeVisible();
});
