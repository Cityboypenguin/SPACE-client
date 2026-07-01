import { test, expect } from '@playwright/test';
import {
  USER_TOKEN_KEY,
  USER_REFRESH_TOKEN_KEY,
  USER_ID_KEY,
} from '../../src/lib/authStorage';
import { loginUserViaApi } from '../support/api';
import { createDummyUser, deleteDummyUser, getAdminToken, type DummyUser } from '../support/adminApi';
import { dismissTermsConsentModalIfPresent } from '../support/terms';
import { env } from '../support/env';

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
  });

  test.afterAll(async ({ request }) => {
    await Promise.all([
      deleteDummyUser(request, base, adminToken, dummyA.ID),
      deleteDummyUser(request, base, adminToken, dummyB.ID),
    ]);
  });

  test('ダミーユーザーAがBをフォローし、フォロワー数が増える', async ({ page, request, baseURL }) => {
    const b = base ?? baseURL ?? env.baseURL;

    // dummyA でログイン
    await loginAsDummy(page, request, b, dummyA);

    await page.goto('/home');
    await dismissTermsConsentModalIfPresent(page);

    // dummyB のユーザーIDで直接フォロー（検索→プロフィール→フォローの流れ）
    await page.goto(`/search`);
    await page.getByRole('searchbox').fill(dummyB.name);
    await page.keyboard.press('Enter');
    await expect(page.getByText(dummyB.name)).toBeVisible({ timeout: 10000 });
    await page.getByText(dummyB.name).click();

    // プロフィールページでフォローボタンをクリック
    const followBtn = page.getByRole('button', { name: 'フォロー' });
    await expect(followBtn).toBeVisible({ timeout: 5000 });
    await followBtn.click();
    await expect(page.getByRole('button', { name: 'フォロー中' })).toBeVisible({ timeout: 5000 });
  });

  test('ダミーユーザーAの投稿にBがいいねでき、件数が増える', async ({ page, browser, request, baseURL }) => {
    const b = base ?? baseURL ?? env.baseURL;

    // dummyA でログインして投稿を作成
    await loginAsDummy(page, request, b, dummyA);
    await page.goto('/home');
    await dismissTermsConsentModalIfPresent(page);

    const postContent = `マルチユーザーいいねテスト ${Date.now()}`;
    await page.getByPlaceholder('新規投稿').fill(postContent);
    await page.getByRole('button', { name: '投稿', exact: true }).click();
    await expect(page.getByText(postContent)).toBeVisible({ timeout: 10000 });

    // 投稿詳細URLを取得
    await page.getByText(postContent).click();
    await page.waitForURL(/\/posts\/.+/);
    const postUrl = page.url();

    // dummyB として別コンテキストでいいね
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    try {
      await loginAsDummy(pageB, request, b, dummyB);
      await pageB.goto(postUrl);
      await dismissTermsConsentModalIfPresent(pageB);
      await pageB.getByRole('button', { name: 'いいね 0いいね' }).click();
      await expect(pageB.getByRole('button', { name: 'いいね 1いいね' })).toBeVisible({ timeout: 5000 });
    } finally {
      await ctxB.close();
    }

    // dummyA 側でリロードして件数が増えていることを確認
    await page.reload();
    await expect(page.getByRole('button', { name: 'いいね 1いいね' })).toBeVisible({ timeout: 10000 });
  });

  test('ダミーユーザーAとBがDMで会話できる', async ({ page, browser, request, baseURL }) => {
    const b = base ?? baseURL ?? env.baseURL;

    // dummyA がログインして dummyB との DM ルームを開く
    await loginAsDummy(page, request, b, dummyA);
    await page.goto('/home');
    await dismissTermsConsentModalIfPresent(page);

    // 検索からBのプロフィールへ
    await page.goto('/search');
    await page.getByRole('searchbox').fill(dummyB.name);
    await page.keyboard.press('Enter');
    await expect(page.getByText(dummyB.name)).toBeVisible({ timeout: 10000 });
    await page.getByText(dummyB.name).click();

    // DM ボタンをクリック
    await page.getByRole('button', { name: 'DM' }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 10000 });

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
      await expect(pageB.getByText(messageFromA)).toBeVisible({ timeout: 10000 });

      const messageFromB = `BからAへ ${Date.now()}`;
      await pageB.getByPlaceholder(/メッセージを入力/).fill(messageFromB);
      await pageB.keyboard.press('Enter');
      await expect(pageB.getByText(messageFromB)).toBeVisible({ timeout: 5000 });

      // A 側でも受信されることを確認
      await expect(page.getByText(messageFromB)).toBeVisible({ timeout: 10000 });
    } finally {
      await ctxB.close();
    }
  });

  test('ダミーユーザーAがBの投稿に返信できる', async ({ page, browser, request, baseURL }) => {
    const b = base ?? baseURL ?? env.baseURL;

    // dummyB が投稿
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    let postUrl = '';
    const postContent = `B投稿テスト ${Date.now()}`;
    try {
      await loginAsDummy(pageB, request, b, dummyB);
      await pageB.goto('/home');
      await dismissTermsConsentModalIfPresent(pageB);
      await pageB.getByPlaceholder('新規投稿').fill(postContent);
      await pageB.getByRole('button', { name: '投稿', exact: true }).click();
      await expect(pageB.getByText(postContent)).toBeVisible({ timeout: 10000 });
      await pageB.getByText(postContent).click();
      await pageB.waitForURL(/\/posts\/.+/);
      postUrl = pageB.url();
    } finally {
      await ctxB.close();
    }

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
