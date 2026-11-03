import { test, expect } from '@playwright/test';

test('NGワードはモーダルで通知し、入力欄の該当箇所だけ伏せ字にする', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('space_user_token', 'ng-word-test'));
  await page.routeWebSocket(/.*/, socket => {
    socket.onMessage(raw => {
      const payload = JSON.parse(String(raw));
      if (payload.type === 'connection_init') socket.send(JSON.stringify({ type: 'connection_ack' }));
    });
  });
  let attempts = 0;
  let failNormally = false;
  await page.route('**/query', async route => {
    const { query, variables = {} } = route.request().postDataJSON();
    if (query.includes('mutation SendMessage') || query.includes('mutation CreateChatThread')) {
      attempts++;
      if (failNormally) {
        await route.fulfill({ json: { errors: [{ message: 'failed to send' }] } });
      } else {
        const original = variables.content ?? variables.title;
        await route.fulfill({ json: { errors: [{
          message: '使えない言葉が含まれているため、投稿できません。内容を直してください',
          extensions: { code: 'NG_WORD_BLOCKED', maskedTexts: [{ original, masked: original.replace(/ＲＥＳＰＯＮ|respon/g, '****') }] },
        }] } });
      }
      return;
    }
    let data = {};
    if (query.includes('query GetRoom')) data = { room: { ID: 'parent1', name: '授業', type: 'course', user: [], isMessagingDisabled: false, lastReadAt: null, lastReadMessageID: null, unreadCount: 0 } };
    else if (query.includes('query ListMessages')) data = { messages: { items: [], hasMoreBefore: false, hasMoreAfter: false } };
    else if (query.includes('query MessageReactionEmojis')) data = { messageReactionEmojis: [] };
    else if (query.includes('query HasUnreadChatThreads')) data = { hasUnreadChatThreads: false };
    else if (query.includes('MarkRoomAsRead')) data = { markRoomAsRead: true };
    await route.fulfill({ json: { data } });
  });
  await page.route('**/ng-word-ui-test', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="ja"><body><div id="root"></div><script type="module">
    import RefreshRuntime from '/@react-refresh';
    RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
    await import('/e2e/fixtures/thread-harness.js');
  </script></body></html>` }));
  await page.goto('/ng-word-ui-test');
  const main = page.locator('main');
  const input = main.getByPlaceholder('メッセージを入力...');
  await input.fill('  前ＲＥＳＰＯＮとrespon後  ');
  await main.getByRole('button', { name: '送信', exact: true }).click();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await expect(modal.getByText('投稿できません', { exact: true })).toBeVisible();
  await expect(input).toHaveValue('  前****と****後  ');
  await expect(main.getByText(/使えない言葉/)).toHaveCount(0);
  expect(attempts).toBe(1);
  await expect(modal.getByRole('button', { name: '閉じる' })).toBeFocused();
  await modal.getByRole('button', { name: '閉じる' }).click();
  await expect(modal).toHaveCount(0);
  await expect(input).toHaveValue('  前****と****後  ');
  expect(attempts).toBe(1);

  // Other send failures keep the draft and use the existing inline error.
  failNormally = true;
  await input.fill('普通の文章');
  await main.getByRole('button', { name: '送信', exact: true }).click();
  await expect(main.getByText('メッセージの送信に失敗しました。時間をおいてから再度お試しください。')).toBeVisible();
  await expect(input).toHaveValue('普通の文章');
  await expect(modal).toHaveCount(0);

  failNormally = false;
  await main.getByRole('button', { name: 'スレッドを作成', exact: true }).click();
  await page.getByLabel('タイトル', { exact: true }).fill('responの相談');
  await page.locator('section[aria-labelledby]').getByRole('button', { name: 'スレッドを作成', exact: true }).click();
  await expect(modal).toBeVisible();
  await expect(page.getByLabel('タイトル', { exact: true })).toHaveValue('****の相談');
  await modal.getByRole('button', { name: '閉じる' }).click();

});
