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

type UserAuth = Awaited<ReturnType<typeof loginUserViaApi>>;

const waitForCommunityRoomReady = async (page: import('@playwright/test').Page, communityName: string) => {
  await waitForRoomReady(page);
  await expect(page.getByText(communityName).first()).toBeVisible({ timeout: 10000 });
};

const openCommunityRoom = async (
  page: import('@playwright/test').Page,
  roomUrl: string,
  communityName: string,
) => {
  await page.goto(roomUrl);
  await dismissTermsConsentModalIfPresent(page);
  await waitForCommunityRoomReady(page, communityName);
};

const expectMessagesExactlyOnce = async (
  page: import('@playwright/test').Page,
  messages: string[],
  communityName: string,
) => {
  let attempt = 0;
  await expect(async () => {
    // 履歴取得が率制限などで失敗した場合だけ、同じ送信を繰り返さず
    // ページを再取得して表示確認をやり直す。
    if (attempt++ > 0) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await dismissTermsConsentModalIfPresent(page);
      await waitForCommunityRoomReady(page, communityName);
    }

    const counts = await Promise.all(
      messages.map((msg) => page.getByText(msg, { exact: true }).count()),
    );
    expect(counts).toEqual(messages.map(() => 1));
  }).toPass({ timeout: 30000, intervals: [500, 1000, 2000, 3000] });
};

const loginAsDummy = async (
  page: import('@playwright/test').Page,
  auth: UserAuth,
) => {
  const { token, refreshToken, user } = auth;
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
  let authA: UserAuth;
  let authB: UserAuth;
  let authC: UserAuth;

  test.beforeAll(async ({ request, baseURL }) => {
    test.setTimeout(60000);
    base = baseURL ?? env.baseURL;
    adminToken = await getAdminToken(request, base);

    [dummyA, dummyB, dummyC] = await Promise.all([
      createDummyUser(request, base, adminToken),
      createDummyUser(request, base, adminToken),
      createDummyUser(request, base, adminToken),
    ]);

    [authA, authB, authC] = await Promise.all([
      loginUserViaApi(request, base, dummyA.email, dummyA.password),
      loginUserViaApi(request, base, dummyB.email, dummyB.password),
      loginUserViaApi(request, base, dummyC.email, dummyC.password),
    ]);

    await Promise.all([
      consentDummyUserToTerms(request, base, authA.token),
      consentDummyUserToTerms(request, base, authB.token),
      consentDummyUserToTerms(request, base, authC.token),
    ]);

    // dummyA がコミュニティを作成（自動的にオーナーとして参加済み）
    communityName = `E2Eマルチチャット ${Date.now()}`;
    const { roomID: rid } = await createCommunityAsUser(request, base, authA.token, communityName, 'マルチユーザーE2Eテスト用');
    roomID = rid;

    // dummyB と dummyC が参加
    await Promise.all([
      joinRoomAsUser(request, base, authB.token, roomID),
      joinRoomAsUser(request, base, authC.token, roomID),
    ]);
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(120000);
    const freshToken = await getAdminToken(request, base).catch(() => adminToken);

    // dummyA はコミュニティオーナーのため、他メンバーがいると削除できない。
    // B・C をコミュニティから退出させてから削除する。
    await leaveRoomAsUser(request, base, authB.token, roomID, dummyB.ID).catch(() => {});
    await leaveRoomAsUser(request, base, authC.token, roomID, dummyC.ID).catch(() => {});

    await deleteDummyUser(request, base, freshToken, dummyA.ID);
    await deleteDummyUser(request, base, freshToken, dummyB.ID);
    await deleteDummyUser(request, base, freshToken, dummyC.ID);
  });

  test('3人のユーザーが同じコミュニティルームでリアルタイムにチャットできる', async ({ page, browser }) => {
    const roomUrl = `/community/chat/${roomID}`;

    // A がルームを開く
    await loginAsDummy(page, authA);
    await openCommunityRoom(page, roomUrl, communityName);

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    const ctxC = await browser.newContext();
    const pageC = await ctxC.newPage();

    try {
      // B・C を直列でセットアップ（並列だと API バーストで 429 が連発するため）
      await loginAsDummy(pageB, authB);
      await openCommunityRoom(pageB, roomUrl, communityName);

      await loginAsDummy(pageC, authC);
      await openCommunityRoom(pageC, roomUrl, communityName);

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

    const msgB = `B同時送信 ${Date.now()}`;
    const msgC = `C同時送信 ${Date.now()}`;

    // B と C が同時にメッセージを送信
    await Promise.all([
      sendMessageAsUser(request, b, authB.token, roomID, msgB),
      sendMessageAsUser(request, b, authC.token, roomID, msgC),
    ]);

    // A のブラウザでルームを開き、両メッセージが届いていることを確認
    await loginAsDummy(page, authA);
    await openCommunityRoom(page, `/community/chat/${roomID}`, communityName);
    await expect(page.getByText(msgB)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(msgC)).toBeVisible({ timeout: 10000 });
  });

  test('10件のメッセージを同時送信しても欠損・重複なく届く', async ({ page, request, baseURL }) => {
    test.setTimeout(60000);
    const b = base ?? baseURL ?? env.baseURL;

    const timestamp = Date.now();
    // B が5件・C が5件、合計10件を同時送信
    // 50ms ずつずらしてバースト 429 を防ぎつつ、競合状態のテストとして有効な同時性を維持する
    const messages = Array.from({ length: 10 }, (_, i) => `同時送信${i + 1} ${timestamp}`);
    await Promise.all(
      messages.map((msg, i) =>
        new Promise<void>((r) => setTimeout(r, i * 50)).then(() =>
          sendMessageAsUser(request, b, i < 5 ? authB.token : authC.token, roomID, msg),
        ),
      ),
    );

    // A のブラウザでルームを開き、全10件が欠損なく届いていることを確認
    await loginAsDummy(page, authA);
    await openCommunityRoom(page, `/community/chat/${roomID}`, communityName);

    // 全件を1つのリトライ単位で検証する。count === 1 で欠損と重複を
    // 同時に検出し、履歴取得だけが失敗した場合はページを再取得する。
    await expectMessagesExactlyOnce(page, messages, communityName);
  });

  test('複数ブラウザから同時にUIでメッセージを送信しても全員に届く', async ({ page, browser }) => {
    const roomUrl = `/community/chat/${roomID}`;

    await loginAsDummy(page, authA);
    await openCommunityRoom(page, roomUrl, communityName);

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    const ctxC = await browser.newContext();
    const pageC = await ctxC.newPage();

    try {
      // B・C を直列でセットアップして API バーストを防ぐ
      await loginAsDummy(pageB, authB);
      await openCommunityRoom(pageB, roomUrl, communityName);

      await loginAsDummy(pageC, authC);
      await openCommunityRoom(pageC, roomUrl, communityName);

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
