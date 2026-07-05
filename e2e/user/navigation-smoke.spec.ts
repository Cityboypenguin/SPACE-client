import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';

// 動的IDを必要としないユーザー画面が、認証済み状態で一通りクラッシュせずに
// 表示されることを確認する。詳細な操作確認は各機能専用のspecで行う。
//
// hasSidebar: false の画面（/inquiry）は未ログインでもお問い合わせできるよう
// protectedElement の外（公開ルート）に置かれているため、UserSidebarを描画しない。
// そのためサイドバー表示チェックの対象から外す。
// heading は原則ページの <h1>/<h2> 見出しを指定する。サイドバーのナビゲーションラベルは
// <span> であり見出しロールを持たないため、getByRole('heading', ...) で検索すれば
// 非表示のサイドバーラベルと文字列が衝突することはない。
// isHeading: false の /home のみ例外（ページ自体に見出しがなく、タブボタンの文言で確認する）。
const routes: { path: string; heading: string | RegExp; hasSidebar?: boolean; isHeading?: boolean }[] = [
  { path: '/home', heading: 'おすすめ', isHeading: false },
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
  { path: '/inquiry', heading: 'お問い合わせ', hasSidebar: false },
];

for (const { path, heading, hasSidebar = true, isHeading = true } of routes) {
  test(`${path} が表示される`, async ({ page }) => {
    await page.goto(path);
    await dismissTermsConsentModalIfPresent(page);
    const locator = isHeading
      ? page.getByRole('heading', { name: heading })
      : page.getByText(heading);
    await expect(locator.first()).toBeVisible();
    if (hasSidebar) {
      // サイドバーが出ている = 未ログインへリダイレクトされていない
      // ラベル文字はホバーで展開されるまで opacity:0 のため、
      // 常時表示のアイコン(alt属性)で判定する。
      await expect(page.getByAltText('ホーム', { exact: true })).toBeVisible();
    }
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
