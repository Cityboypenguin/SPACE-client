import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';
import { loginAsSecondUser } from '../support/secondUser';
import {
  setupCourseChatFixture,
  sendMessageViaApi,
  type CourseChatFixture,
  type SentMessage,
} from '../support/courseChatFixture';
import { env } from '../support/env';

test.describe('授業チャットの履歴表示', () => {
  let fixture: CourseChatFixture;
  let sentMessages: SentMessage[] = [];
  const messages = [
    `E2E履歴テスト1件目 ${Date.now()}`,
    `E2E履歴テスト2件目 ${Date.now()}`,
    `E2E履歴テスト3件目 ${Date.now()}`,
  ];

  test.beforeAll(async ({ request, baseURL }) => {
    const base = baseURL ?? env.baseURL;
    fixture = await setupCourseChatFixture(request, base);
    // UI操作の手間・flakinessを避けるため、履歴として表示させたい投稿はAPIで
    // 直接作成する（送信操作そのものはchat-send.spec.tsで別途検証済み）。
    sentMessages = [];
    for (const content of messages) {
      sentMessages.push(await sendMessageViaApi(request, base, fixture.userToken, fixture.roomID, content));
    }
  });

  test.afterAll(async () => {
    await fixture.cleanup();
  });

  test('授業チャットの履歴が表示され、複数投稿が一貫した順序で表示される', async ({ page }) => {
    await page.goto(`/courses/chat/${fixture.roomID}`);
    await dismissTermsConsentModalIfPresent(page);

    for (const content of messages) {
      await expect(page.getByText(content)).toBeVisible();
    }

    // 投稿順（古い→新しい）でDOM上に並んでいることを確認する
    const boundingBoxes = await Promise.all(
      messages.map((content) => page.getByText(content).boundingBox()),
    );
    for (let i = 1; i < boundingBoxes.length; i++) {
      const prev = boundingBoxes[i - 1];
      const current = boundingBoxes[i];
      expect(prev).not.toBeNull();
      expect(current).not.toBeNull();
      // 上に表示されているものほどy座標が小さい（古い投稿が上）
      expect(prev!.y).toBeLessThan(current!.y);
    }
  });

  test('投稿時刻が表示される', async ({ page }) => {
    await page.goto(`/courses/chat/${fixture.roomID}`);
    await dismissTermsConsentModalIfPresent(page);

    await expect(page.getByText(messages[0])).toBeVisible();

    // HH:MM 形式のタイムスタンプが少なくとも1つ表示されていることを確認する。
    const timestampPattern = /\d{1,2}:\d{2}/;
    await expect(page.getByText(timestampPattern).first()).toBeVisible();
  });

  test('自分以外の視点では投稿者の送信者名が表示される', async ({ browser, request, baseURL }) => {
    // 自分の投稿は吹き出しに送信者名を出さない仕様（isMineの場合は非表示）のため、
    // 別ユーザーの視点で開いて初めて送信者名が見える。授業チャットは時間割未登録でも
    // 閲覧自体は可能（サーバー側で全授業に公開）なため、2人目ユーザーは時間割登録なしで
    // そのままルームを開いて確認できる。
    const base = baseURL ?? env.baseURL;
    const otherUserPage = await loginAsSecondUser(browser, request, base);
    try {
      await otherUserPage.goto(`/courses/chat/${fixture.roomID}`);
      await dismissTermsConsentModalIfPresent(otherUserPage);

      const firstMessage = sentMessages[0];
      await expect(otherUserPage.getByText(messages[0])).toBeVisible();
      await expect(otherUserPage.getByText(firstMessage.user.name)).toBeVisible();
    } finally {
      await otherUserPage.context().close();
    }
  });
});
