import { test, expect } from '@playwright/test';
import {
  USER_TOKEN_KEY,
  USER_REFRESH_TOKEN_KEY,
  USER_ID_KEY,
} from '../../../src/lib/authStorage';
import { loginUserViaApi } from '../../support/api';
import {
  createDummyUser,
  deleteDummyUser,
  getAdminToken,
  consentDummyUserToTerms,
  createCommunityAsUser,
  joinRoomAsUser,
  leaveRoomAsUser,
  sendMessageAsUser,
  type DummyUser,
} from '../../support/adminApi';
import { dismissTermsConsentModalIfPresent, waitForRoomReady } from '../../support/terms';
import { env } from '../../support/env';

const waitForCommunityRoomReady = async (page: import('@playwright/test').Page, communityName: string) => {
  await expect(page.getByText(communityName).first()).toBeVisible({ timeout: 10000 });
  await waitForRoomReady(page);
};

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

test.describe('コミュニティ複数ユーザーチャット', () => {
  // 同一コミュニティ・ユーザーを共有するため直列実行（fullyParallel でも2ワーカーに分割されないよう）
  test.describe.configure({ mode: 'serial' });
  let adminToken: string;
  let dummyA: DummyUser;
  let dummyB: DummyUser;
  let dummyC: DummyUser;
  let base: string;
  let roomID: string;
  let communityName: string;

  test.beforeAll(async ({ request, baseURL }) => {
    test.setTimeout(60000);
    base = baseURL ?? env.baseURL;
    adminToken = await getAdminToken(request, base);

    [dummyA, dummyB, dummyC] = await Promise.all([
      createDummyUser(request, base, adminToken),
      createDummyUser(request, base, adminToken),
      createDummyUser(request, base, adminToken),
    ]);

    const [{ token: tokenA }, { token: tokenB }, { token: tokenC }] = await Promise.all([
      loginUserViaApi(request, base, dummyA.email, dummyA.password),
      loginUserViaApi(request, base, dummyB.email, dummyB.password),
      loginUserViaApi(request, base, dummyC.email, dummyC.password),
    ]);

    await Promise.all([
      consentDummyUserToTerms(request, base, tokenA),
      consentDummyUserToTerms(request, base, tokenB),
      consentDummyUserToTerms(request, base, tokenC),
    ]);

    // dummyA がコミュニティを作成（自動的にオーナーとして参加済み）
    communityName = `E2Eマルチチャット ${Date.now()}`;
    const { roomID: rid } = await createCommunityAsUser(request, base, tokenA, communityName, 'マルチユーザーE2Eテスト用');
    roomID = rid;

    // dummyB と dummyC が参加
    await Promise.all([
      joinRoomAsUser(request, base, tokenB, roomID),
      joinRoomAsUser(request, base, tokenC, roomID),
    ]);
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(120000);
    const freshToken = await getAdminToken(request, base).catch(() => adminToken);

    // dummyA はコミュニティオーナーのため、他メンバーがいると削除できない。
    // B・C をコミュニティから退出させてから削除する。
    const [resB, resC] = await Promise.allSettled([
      loginUserViaApi(request, base, dummyB.email, dummyB.password),
      loginUserViaApi(request, base, dummyC.email, dummyC.password),
    ]);
    if (resB.status === 'fulfilled') {
      await leaveRoomAsUser(request, base, resB.value.token, roomID, dummyB.ID).catch(() => {});
    }
    if (resC.status === 'fulfilled') {
      await leaveRoomAsUser(request, base, resC.value.token, roomID, dummyC.ID).catch(() => {});
    }

    await deleteDummyUser(request, base, freshToken, dummyA.ID);
    await deleteDummyUser(request, base, freshToken, dummyB.ID);
    await deleteDummyUser(request, base, freshToken, dummyC.ID);
  });

  test('3人のユーザーが同じコミュニティルームでリアルタイムにチャットできる', async ({ page, browser, request, baseURL }) => {
    const b = base ?? baseURL ?? env.baseURL;
    const roomUrl = `/community/chat/${roomID}`;

    // A がルームを開く
    await loginAsDummy(page, request, b, dummyA);
    await page.goto(roomUrl);
    await dismissTermsConsentModalIfPresent(page);
    await waitForCommunityRoomReady(page, communityName);

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    const ctxC = await browser.newContext();
    const pageC = await ctxC.newPage();

    try {
      // B・C を直列でセットアップ（並列だと API バーストで 429 が連発するため）
      await loginAsDummy(pageB, request, b, dummyB);
      await pageB.goto(roomUrl);
      await dismissTermsConsentModalIfPresent(pageB);
      await waitForCommunityRoomReady(pageB, communityName);

      await loginAsDummy(pageC, request, b, dummyC);
      await pageC.goto(roomUrl);
      await dismissTermsConsentModalIfPresent(pageC);
      await waitForCommunityRoomReady(pageC, communityName);

      // B・C の WebSocket サブスクリプションが確立されるまで待機
      await page.waitForTimeout(1000);

      // A がメッセージを送信 → B・C に WebSocket でリアルタイム反映される
      const msgFromA = `Aからのメッセージ ${Date.now()}`;
      await page.getByPlaceholder(/メッセージを入力/).fill(msgFromA);
      await page.keyboard.press('Enter');
      await expect(page.getByText(msgFromA)).toBeVisible({ timeout: 5000 });
      await expect(pageB.getByText(msgFromA)).toBeVisible({ timeout: 10000 });
      await expect(pageC.getByText(msgFromA)).toBeVisible({ timeout: 10000 });

      // B がメッセージを送信 → A・C に反映される
      const msgFromB = `Bからのメッセージ ${Date.now()}`;
      await pageB.getByPlaceholder(/メッセージを入力/).fill(msgFromB);
      await pageB.keyboard.press('Enter');
      await expect(pageB.getByText(msgFromB)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(msgFromB)).toBeVisible({ timeout: 10000 });
      await expect(pageC.getByText(msgFromB)).toBeVisible({ timeout: 10000 });

      // C がメッセージを送信 → A・B に反映される
      const msgFromC = `Cからのメッセージ ${Date.now()}`;
      await pageC.getByPlaceholder(/メッセージを入力/).fill(msgFromC);
      await pageC.keyboard.press('Enter');
      await expect(pageC.getByText(msgFromC)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(msgFromC)).toBeVisible({ timeout: 10000 });
      await expect(pageB.getByText(msgFromC)).toBeVisible({ timeout: 10000 });
    } finally {
      await ctxB.close();
      await ctxC.close();
    }
  });

  test('BとCが同時にメッセージを送っても両方ルームに届く', async ({ page, request, baseURL }) => {
    const b = base ?? baseURL ?? env.baseURL;

    const [{ token: tokenB }, { token: tokenC }] = await Promise.all([
      loginUserViaApi(request, b, dummyB.email, dummyB.password),
      loginUserViaApi(request, b, dummyC.email, dummyC.password),
    ]);

    const msgB = `B同時送信 ${Date.now()}`;
    const msgC = `C同時送信 ${Date.now()}`;

    // B と C が同時にメッセージを送信
    await Promise.all([
      sendMessageAsUser(request, b, tokenB, roomID, msgB),
      sendMessageAsUser(request, b, tokenC, roomID, msgC),
    ]);

    // A のブラウザでルームを開き、両メッセージが届いていることを確認
    await loginAsDummy(page, request, b, dummyA);
    await page.goto(`/community/chat/${roomID}`);
    await dismissTermsConsentModalIfPresent(page);
    await waitForCommunityRoomReady(page, communityName);
    await expect(page.getByText(msgB)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(msgC)).toBeVisible({ timeout: 10000 });
  });

  test('10件のメッセージを同時送信しても欠損・重複なく届く', async ({ page, request, baseURL }) => {
    const b = base ?? baseURL ?? env.baseURL;

    const [{ token: tokenB }, { token: tokenC }] = await Promise.all([
      loginUserViaApi(request, b, dummyB.email, dummyB.password),
      loginUserViaApi(request, b, dummyC.email, dummyC.password),
    ]);

    const timestamp = Date.now();
    // B が5件・C が5件、合計10件を同時送信
    const messages = Array.from({ length: 10 }, (_, i) => `同時送信${i + 1} ${timestamp}`);
    await Promise.all(
      messages.map((msg, i) =>
        sendMessageAsUser(request, b, i < 5 ? tokenB : tokenC, roomID, msg),
      ),
    );

    // A のブラウザでルームを開き、全10件が欠損なく届いていることを確認
    await loginAsDummy(page, request, b, dummyA);
    await page.goto(`/community/chat/${roomID}`);
    await dismissTermsConsentModalIfPresent(page);
    await waitForCommunityRoomReady(page, communityName);

    for (const msg of messages) {
      await expect(page.getByText(msg)).toBeVisible({ timeout: 10000 });
    }
    // 各メッセージが1件だけ表示されていること（重複なし）
    for (const msg of messages) {
      await expect(page.getByText(msg)).toHaveCount(1);
    }
  });

  test('複数ブラウザから同時にUIでメッセージを送信しても全員に届く', async ({ page, browser, request, baseURL }) => {
    const b = base ?? baseURL ?? env.baseURL;
    const roomUrl = `/community/chat/${roomID}`;

    await loginAsDummy(page, request, b, dummyA);
    await page.goto(roomUrl);
    await dismissTermsConsentModalIfPresent(page);
    await waitForCommunityRoomReady(page, communityName);

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    const ctxC = await browser.newContext();
    const pageC = await ctxC.newPage();

    try {
      // B・C を直列でセットアップして API バーストを防ぐ
      await loginAsDummy(pageB, request, b, dummyB);
      await pageB.goto(roomUrl);
      await dismissTermsConsentModalIfPresent(pageB);
      await waitForCommunityRoomReady(pageB, communityName);

      await loginAsDummy(pageC, request, b, dummyC);
      await pageC.goto(roomUrl);
      await dismissTermsConsentModalIfPresent(pageC);
      await waitForCommunityRoomReady(pageC, communityName);

      // WebSocket サブスクリプションの確立を待機
      await page.waitForTimeout(1000);

      const timestamp = Date.now();
      const msgA = `A UI同時 ${timestamp}`;
      const msgB = `B UI同時 ${timestamp}`;
      const msgC = `C UI同時 ${timestamp}`;

      // 3人が同時にブラウザ UI からメッセージを送信
      await Promise.all([
        (async () => {
          await page.getByPlaceholder(/メッセージを入力/).fill(msgA);
          await page.keyboard.press('Enter');
        })(),
        (async () => {
          await pageB.getByPlaceholder(/メッセージを入力/).fill(msgB);
          await pageB.keyboard.press('Enter');
        })(),
        (async () => {
          await pageC.getByPlaceholder(/メッセージを入力/).fill(msgC);
          await pageC.keyboard.press('Enter');
        })(),
      ]);

      // 3件のメッセージが全ブラウザで受信されていることを確認
      for (const p of [page, pageB, pageC]) {
        for (const msg of [msgA, msgB, msgC]) {
          await expect(p.getByText(msg)).toBeVisible({ timeout: 15000 });
        }
      }
    } finally {
      await ctxB.close();
      await ctxC.close();
    }
  });
});
