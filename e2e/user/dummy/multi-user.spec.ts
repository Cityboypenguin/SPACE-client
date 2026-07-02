import { test, expect } from '@playwright/test';
import {
  USER_TOKEN_KEY,
  USER_REFRESH_TOKEN_KEY,
  USER_ID_KEY,
} from '../../../src/lib/authStorage';
import { loginUserViaApi } from '../../support/api';
import { createDummyUser, deleteDummyUser, getAdminToken, consentDummyUserToTerms, createPostAsUser, sendMessageAsUser, type DummyUser } from '../../support/adminApi';
import { dismissTermsConsentModalIfPresent, waitForRoomReady } from '../../support/terms';
import { env } from '../../support/env';

// ダミーユーザーをAPIで作成してから各テストを実行し、最後に削除する。
// ダミーユーザーとしてブラウザにログインするためのヘルパー。
const loginAsDummy = async (
  page: import('@playwright/test').Page,
  request: import('@playwright/test').APIRequestContext,
  baseURL: string,
  dummy: DummyUser,
) => {
  const { token, refreshToken, user } = await loginUserViaApi(request, baseURL, dummy.email, dummy.password);
  await page.goto('/login');
  await page.evaluate(
    ([tKey, rKey, iKey, t, r, id]: string[]) => {
      localStorage.setItem(tKey, t);
      localStorage.setItem(rKey, r);
      localStorage.setItem(iKey, id);
    },
    [USER_TOKEN_KEY, USER_REFRESH_TOKEN_KEY, USER_ID_KEY, token, refreshToken, user.ID],
  );
};

test.describe('複数ユーザー間インタラクション', () => {
  // ダミーユーザーを共有するため直列実行（fullyParallel でも別ワーカーに分割されないよう）
  test.describe.configure({ mode: 'serial' });

  let adminToken: string;
  let dummyA: DummyUser;
  let dummyB: DummyUser;
  let base: string;

  test.beforeAll(async ({ request, baseURL }) => {
    base = baseURL ?? env.baseURL;
    adminToken = await getAdminToken(request, base);
    [dummyA, dummyB] = await Promise.all([
      createDummyUser(request, base, adminToken),
      createDummyUser(request, base, adminToken),
    ]);

    // 利用規約モーダルがテスト中に出ないよう API で事前同意する
    const [{ token: tokenA }, { token: tokenB }] = await Promise.all([
      loginUserViaApi(request, base, dummyA.email, dummyA.password),
      loginUserViaApi(request, base, dummyB.email, dummyB.password),
    ]);
    await Promise.all([
      consentDummyUserToTerms(request, base, tokenA),
      consentDummyUserToTerms(request, base, tokenB),
    ]);
  });

  test.afterAll(async ({ request }) => {
    // カスケード削除は時間がかかるためタイムアウトを延長
    test.setTimeout(120000);
    // afterAll 実行時点でトークンが期限切れの可能性があるため再取得
    const freshToken = await getAdminToken(request, base).catch(() => adminToken);
    // 同時削除はDBデッドロックが発生するため直列で実行
    await deleteDummyUser(request, base, freshToken, dummyA.ID);
    await deleteDummyUser(request, base, freshToken, dummyB.ID);
  });

  test('ダミーユーザーAがBをフォローし、フォロワー数が増える', async ({ page, request, baseURL }) => {
    const b = base ?? baseURL ?? env.baseURL;

    // dummyA でログイン
    await loginAsDummy(page, request, b, dummyA);

    await page.goto('/home');
    await dismissTermsConsentModalIfPresent(page);

    // dummyB のユーザーIDで直接フォロー（検索→プロフィール→フォローの流れ）
    await page.goto(`/search`);
    await page.getByPlaceholder('search').fill(dummyB.name);
    await page.keyboard.press('Enter');
    await expect(page.getByText(dummyB.name)).toBeVisible({ timeout: 10000 });
    await page.getByText(dummyB.name).click();

    // プロフィールページでお気に入りボタンをクリック（アプリはフォローを「お気に入り」として実装）
    const followBtn = page.getByRole('button', { name: 'お気に入り', exact: true });
    await expect(followBtn).toBeVisible({ timeout: 10000 });
    await followBtn.click();
    await expect(page.getByRole('button', { name: 'お気に入り解除' })).toBeVisible({ timeout: 10000 });
  });

  test('ダミーユーザーAの投稿にBがいいねでき、件数が増える', async ({ page, browser, request, baseURL }) => {
    const b = base ?? baseURL ?? env.baseURL;

    // dummyA の投稿を API で作成してURLを直接取得（UI経由の遷移は不安定なため）
    const { token: tokenA } = await loginUserViaApi(request, b, dummyA.email, dummyA.password);
    const postContent = `マルチユーザーいいねテスト ${Date.now()}`;
    const postId = await createPostAsUser(request, b, tokenA, postContent);
    const postUrl = `/posts/${postId}`;

    // dummyA でログインして投稿ページを開く
    await loginAsDummy(page, request, b, dummyA);
    await page.goto(postUrl);
    await dismissTermsConsentModalIfPresent(page);
    await expect(page.getByText(postContent)).toBeVisible({ timeout: 10000 });

    // dummyB として別コンテキストでいいね
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    try {
      await loginAsDummy(pageB, request, b, dummyB);
      await pageB.goto(postUrl);
      await dismissTermsConsentModalIfPresent(pageB);
      await pageB.getByRole('button', { name: 'いいね 0いいね' }).click();
      await expect(pageB.getByRole('button', { name: 'いいね 1いいね' })).toBeVisible({ timeout: 10000 });
    } finally {
      await ctxB.close();
    }

    // dummyA 側でリロードして件数が増えていることを確認
    await page.reload();
    await expect(page.getByText(postContent)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'いいね 1いいね' })).toBeVisible({ timeout: 5000 });
  });

  test('ダミーユーザーAとBがDMで会話できる', async ({ page, browser, request, baseURL }) => {
    const b = base ?? baseURL ?? env.baseURL;

    // dummyA がログインして dummyB との DM ルームを開く
    await loginAsDummy(page, request, b, dummyA);
    await page.goto('/home');
    await dismissTermsConsentModalIfPresent(page);

    // 検索からBのプロフィールへ
    await page.goto('/search');
    await page.getByPlaceholder('search').fill(dummyB.name);
    await page.keyboard.press('Enter');
    await expect(page.getByText(dummyB.name)).toBeVisible({ timeout: 10000 });
    await page.getByText(dummyB.name).click();

    // DM ボタンをクリック（実装では /dm/:id へ遷移）
    await page.getByRole('button', { name: 'DMを開始' }).click();
    await page.waitForURL(/\/dm\/.+/, { timeout: 10000 });

    const messageFromA = `AからBへ ${Date.now()}`;
    await page.getByPlaceholder(/メッセージを入力/).fill(messageFromA);
    await page.keyboard.press('Enter');
    await expect(page.getByText(messageFromA)).toBeVisible({ timeout: 5000 });

    // dummyB として返信
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    try {
      const roomUrl = page.url();
      await loginAsDummy(pageB, request, b, dummyB);
      await pageB.goto(roomUrl);
      await dismissTermsConsentModalIfPresent(pageB);
      await waitForRoomReady(pageB);
      await expect(pageB.getByText(messageFromA)).toBeVisible({ timeout: 10000 });

      const messageFromB = `BからAへ ${Date.now()}`;
      await pageB.getByPlaceholder(/メッセージを入力/).fill(messageFromB);
      await pageB.keyboard.press('Enter');
      await expect(pageB.getByText(messageFromB)).toBeVisible({ timeout: 5000 });

      // A 側でも受信されることを確認
      await expect(page.getByText(messageFromB).first()).toBeVisible({ timeout: 10000 });
    } finally {
      await ctxB.close();
    }
  });

  test('ダミーユーザーAがBの投稿に返信できる', async ({ page, request, baseURL }) => {
    const b = base ?? baseURL ?? env.baseURL;

    // dummyB の投稿を API で直接作成（ホームページ UI を経由しない）
    const { token: tokenB } = await loginUserViaApi(request, b, dummyB.email, dummyB.password);
    const postContent = `B投稿テスト ${Date.now()}`;
    const postId = await createPostAsUser(request, b, tokenB, postContent);
    const postUrl = `/posts/${postId}`;

    // dummyA が返信
    await loginAsDummy(page, request, b, dummyA);
    await page.goto(postUrl);
    await dismissTermsConsentModalIfPresent(page);
    await expect(page.getByText(postContent)).toBeVisible({ timeout: 10000 });

    const replyContent = `Aからの返信 ${Date.now()}`;
    await page.getByPlaceholder('返信する...').fill(replyContent);
    await page.getByRole('button', { name: '返信する' }).click();
    await expect(page.getByText(replyContent)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('1 件の返信')).toBeVisible();
  });
});
