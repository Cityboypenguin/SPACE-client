import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';

// 動的IDを必要としないユーザー画面が、認証済み状態で一通りクラッシュせずに
// 表示されることを確認する。詳細な操作確認は各機能専用のspecで行う。
const routes: { path: string; heading: string | RegExp }[] = [
  { path: '/home', heading: 'ホーム' },
  { path: '/mypage', heading: 'マイページ' },
  { path: '/mypage/settings', heading: '設定' },
  { path: '/mypage/profile-edit', heading: 'プロフィール編集' },
  { path: '/mypage/user-info-edit', heading: 'ユーザー情報の編集' },
  { path: '/mypage/favorites', heading: 'お気に入りリスト' },
  { path: '/mypage/followers', heading: 'フォロワー' },
  { path: '/mypage/blocks', heading: 'ブロック一覧' },
  { path: '/dm', heading: 'DM' },
  { path: '/community', heading: '参加中のコミュニティ' },
  { path: '/community/browse', heading: 'コミュニティを探す' },
  { path: '/community/create', heading: 'コミュニティを作る' },
  { path: '/notifications', heading: '通知一覧' },
  { path: '/inquiry', heading: 'お問い合わせ' },
];

for (const { path, heading } of routes) {
  test(`${path} が表示される`, async ({ page }) => {
    await page.goto(path);
    await dismissTermsConsentModalIfPresent(page);
    await expect(page.getByText(heading).first()).toBeVisible();
    // サイドバーが出ている = 未ログインへリダイレクトされていない
    await expect(page.getByText('ホーム', { exact: true })).toBeVisible();
  });
}

test('検索画面が表示される', async ({ page }) => {
  await page.goto('/search');
  await dismissTermsConsentModalIfPresent(page);
  await expect(page.getByPlaceholder('search')).toBeVisible();
});

test('未知のパスはNotFoundになる', async ({ page }) => {
  await page.goto('/this-route-does-not-exist');
  await expect(page.getByText('ページが見つかりませんでした')).toBeVisible();
});
