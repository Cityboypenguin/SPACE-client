import { test, expect } from '@playwright/test';

// 動的IDを必要としない管理者画面が、認証済み状態で一通りクラッシュせずに
// 表示されることを確認する。
const routes: { path: string; heading: string }[] = [
  { path: '/admin', heading: 'ダッシュボード' },
  { path: '/admin/users', heading: 'ユーザー一覧' },
  { path: '/admin/administrators', heading: '管理者一覧' },
  { path: '/admin/communities', heading: 'コミュニティ一覧' },
  { path: '/admin/posts', heading: '投稿管理' },
  { path: '/admin/reports', heading: '通報管理一覧' },
  { path: '/admin/inquiries', heading: '問い合わせ管理' },
  { path: '/admin/announcements', heading: 'お知らせ管理' },
  { path: '/admin/announcements/new', heading: 'お知らせ作成' },
  { path: '/admin/terms', heading: '利用規約管理' },
  { path: '/admin/terms/new', heading: '利用規約バージョン登録' },
  { path: '/admin/maintenance', heading: 'メンテナンス管理' },
];

for (const { path, heading } of routes) {
  test(`${path} が表示される`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByText(heading).first()).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}$`));
  });
}
