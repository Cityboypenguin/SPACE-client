import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';
import { setupCourseChatFixture, type CourseChatFixture } from '../support/courseChatFixture';
import { env } from '../support/env';

test.describe('授業チャットのメッセージ送信', () => {
  let fixture: CourseChatFixture;

  test.beforeAll(async ({ request, baseURL }) => {
    fixture = await setupCourseChatFixture(request, baseURL ?? env.baseURL);
  });

  test.afterAll(async () => {
    await fixture.cleanup();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/courses/chat/${fixture.roomID}`);
    await dismissTermsConsentModalIfPresent(page);
    await expect(page.getByRole('textbox')).toBeVisible();
  });

  test('正常なメッセージを送信すると自分の画面に表示される', async ({ page }) => {
    const content = `E2E通常送信テスト ${Date.now()}`;
    await page.getByRole('textbox').fill(content);
    await page.getByRole('button', { name: '送信' }).click();

    await expect(page.getByText(content)).toBeVisible();
    // 送信後は入力欄がクリアされる
    await expect(page.getByRole('textbox')).toHaveValue('');
  });

  test('空文字のときは送信ボタンが無効になる', async ({ page }) => {
    await page.getByRole('textbox').fill('');
    await expect(page.getByRole('button', { name: '送信' })).toBeDisabled();
  });

  test('スペースのみのときは送信ボタンが無効になる', async ({ page }) => {
    await page.getByRole('textbox').fill('   ');
    await expect(page.getByRole('button', { name: '送信' })).toBeDisabled();
  });

  test('絵文字・改行・HTMLタグ・XSS文字列・SQL風文字列を送信しても安全にテキストとして表示される', async ({ page }) => {
    // scriptタグが実際に実行されるとalertダイアログが開くはずなので、そのイベントを
    // 監視して「ダイアログが一度も発火しない」ことをXSSが実行されていない証拠とする。
    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    const payloads = [
      `絵文字テスト 😀🎉👍 ${Date.now()}`,
      `改行テスト\n2行目\n3行目 ${Date.now()}`,
      `<b>太字のはずが効かないテスト</b> ${Date.now()}`,
      `<script>alert('xss-${Date.now()}')</script>危険なメッセージ`,
      `SQL風文字列テスト ' OR '1'='1 ${Date.now()}`,
    ];

    for (const content of payloads) {
      await test.step(`送信: ${content.slice(0, 30)}...`, async () => {
        await page.getByRole('textbox').fill(content);
        await page.getByRole('button', { name: '送信' }).click();

        // 改行を含むテキストは getByText の既定の正規化で改行が空白に変換されるため、
        // 先頭の一意な部分文字列で表示確認する。
        const uniqueMarker = content.split('\n')[0];
        await expect(page.getByText(uniqueMarker, { exact: false }).first()).toBeVisible();
      });
    }

    // <script> が実要素として挿入・実行されていないことを確認する
    const scriptCount = await page.locator('script:has-text("xss-")').count();
    expect(scriptCount).toBe(0);
    expect(dialogTriggered).toBe(false);
  });
});
