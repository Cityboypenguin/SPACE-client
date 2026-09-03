import { test, expect } from '@playwright/test';
import { env } from '../support/env';

test.describe('管理者ログイン', () => {
  test('ログイン画面が表示される', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByPlaceholder('Admin Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('誤った認証情報ではエラーが表示される', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByPlaceholder('Admin Email').fill('not-a-real-admin@example.com');
    await page.getByPlaceholder('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('正しい認証情報でダッシュボードへ遷移する', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByPlaceholder('Admin Email').fill(env.admin.email);
    await page.getByPlaceholder('Password').fill(env.admin.password);
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
  });
});
