import { test, expect } from '@playwright/test';
import { loginAsUser } from '../support/secondUser';
import { setupCourseChatFixture, sendMessageViaApi, type CourseChatFixture } from '../support/courseChatFixture';
import { env } from '../support/env';

// このspecは admin project（storageStateが管理者用）で実行される。
test.describe('管理者による授業チャットメッセージの削除', () => {
  let fixture: CourseChatFixture;
  let messageContent: string;

  test.beforeEach(async ({ request, baseURL }) => {
    const base = baseURL ?? env.baseURL;
    fixture = await setupCourseChatFixture(request, base);
    messageContent = `E2E管理者削除テスト ${Date.now()}`;
    await sendMessageViaApi(request, base, fixture.userToken, fixture.roomID, messageContent);
  });

  test.afterEach(async () => {
    await fixture.cleanup();
  });

  test('管理者が授業チャットの投稿を削除でき、一般ユーザー画面にも削除が反映される', async ({ page, browser, request, baseURL }) => {
    // 管理者削除の確認はSweetAlert2ではなくwindow.confirmで行われる実装
    // （AdminCourseChatDetailPage.handleDeleteMessage）。
    page.on('dialog', (dialog) => dialog.accept());

    await page.goto(`/admin/courses/${fixture.courseID}`);
    await expect(page.getByRole('heading', { name: '授業チャット詳細' })).toBeVisible();
    await expect(page.getByText(messageContent)).toBeVisible();

    await page
      .locator('tr', { hasText: messageContent })
      .getByRole('button', { name: '削除' })
      .click();

    // 削除後は管理画面のメッセージ一覧から消える
    await expect(page.getByText(messageContent)).toHaveCount(0);

    // 一般ユーザー側（別コンテキスト）でも同じメッセージが表示されなくなっていることを
    // 確認する（deleteMessageはソフトデリートだが、一般ユーザー向けクエリからは
    // 除外される仕様）。
    const base = baseURL ?? env.baseURL;
    const userPage = await loginAsUser(browser, request, base, env.user.email, env.user.password);
    try {
      await userPage.goto(`/courses/chat/${fixture.roomID}`);
      await expect(userPage.getByText(messageContent)).toHaveCount(0);
    } finally {
      await userPage.context().close();
    }
  });

  test('非管理者（一般ユーザー）は管理者用の授業チャット削除画面にアクセスできない', async ({ browser, request, baseURL }) => {
    const base = baseURL ?? env.baseURL;
    const userPage = await loginAsUser(browser, request, base, env.user.email, env.user.password);
    try {
      // 一般ユーザーのローカルストレージには管理者トークンが無いため、
      // AdminProtectedRouteによって管理者ログイン画面へリダイレクトされる。
      await userPage.goto(`/admin/courses/${fixture.courseID}`);
      await expect(userPage).toHaveURL(/\/admin\/login$/);
      await expect(userPage.getByText(messageContent)).toHaveCount(0);
    } finally {
      await userPage.context().close();
    }
  });
});
