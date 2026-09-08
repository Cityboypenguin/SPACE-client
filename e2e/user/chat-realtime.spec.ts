import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';
import { loginAsSecondUser } from '../support/secondUser';
import { setupCourseChatFixture, type CourseChatFixture } from '../support/courseChatFixture';
import { env } from '../support/env';

test.describe('授業チャットのリアルタイム更新', () => {
  let fixture: CourseChatFixture;

  test.beforeAll(async ({ request, baseURL }) => {
    fixture = await setupCourseChatFixture(request, baseURL ?? env.baseURL);
  });

  test.afterAll(async () => {
    await fixture.cleanup();
  });

  test('ユーザーAの送信がリロードなしでユーザーBの画面に表示される', async ({ page, browser, request, baseURL }) => {
    const base = baseURL ?? env.baseURL;

    // ユーザーA: メインの page fixture（storageStateでログイン済み）
    await page.goto(`/courses/chat/${fixture.roomID}`);
    await dismissTermsConsentModalIfPresent(page);
    await expect(page.getByRole('textbox')).toBeVisible();

    // ユーザーB: 2人目のユーザーで別ブラウザコンテキストを開く。授業チャットの閲覧は
    // 時間割登録の有無に関わらず可能なため、追加のセットアップは不要。
    const userBPage = await loginAsSecondUser(browser, request, base);
    try {
      await userBPage.goto(`/courses/chat/${fixture.roomID}`);
      await dismissTermsConsentModalIfPresent(userBPage);

      const content = `E2Eリアルタイムテスト ${Date.now()}`;

      // ユーザーAが送信
      await page.getByRole('textbox').fill(content);
      await page.getByRole('button', { name: '送信' }).click();
      await expect(page.getByText(content)).toBeVisible();

      // ユーザーBの画面はリロードしていないが、WebSocketのmessageAddedサブスクリプション
      // 経由でメッセージが自動的に反映されるはず。
      await expect(userBPage.getByText(content)).toBeVisible({ timeout: 10000 });
    } finally {
      await userBPage.context().close();
    }
  });
});
