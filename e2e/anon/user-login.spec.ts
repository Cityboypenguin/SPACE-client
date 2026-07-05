import { test, expect } from '@playwright/test';
import { env } from '../support/env';

test.describe('ユーザーログイン', () => {
  test('ログイン画面が表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('メールアドレス')).toBeVisible();
    await expect(page.getByPlaceholder('パスワード')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('誤った認証情報ではエラーが表示される', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('メールアドレス').fill('not-a-real-user@example.com');
    await page.getByPlaceholder('パスワード').fill('wrong-password');
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('正しい認証情報でホームへ遷移する', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('メールアドレス').fill(env.user.email);
    await page.getByPlaceholder('パスワード').fill(env.user.password);
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page).toHaveURL(/\/home$/);
    // サイドバーのラベル文字はホバーで展開されるまで opacity:0 のため、
    // 常時表示のアイコン(alt属性)でログイン後のサイドバー表示を確認する。
    await expect(page.getByAltText('ホーム', { exact: true })).toBeVisible();
  });

  test('新規登録ボタンで登録画面へ遷移する', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: '新規登録' }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', { name: '新規会員登録' })).toBeVisible();
  });

  test('パスワードを忘れた場合の画面へ遷移する', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'パスワードを忘れた場合' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole('heading', { name: 'パスワードを再設定する' })).toBeVisible();
  });

  test('お問い合わせ画面へ遷移する', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'お問い合わせはこちら' }).click();
    await expect(page).toHaveURL(/\/inquiry$/);
    await expect(page.getByRole('heading', { name: 'お問い合わせ' })).toBeVisible();
  });
});
