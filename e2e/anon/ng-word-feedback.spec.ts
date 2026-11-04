import { test, expect } from '@playwright/test';

for (const closeWith of ['click', 'enter'] as const) {
test(`NGワード通知後も同じ入力欄で編集できる（閉じ方: ${closeWith}）`, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('space_user_token', 'ng-word-test'));
  await page.routeWebSocket(/.*/, socket => {
    socket.onMessage(raw => {
      const payload = JSON.parse(String(raw));
      if (payload.type === 'connection_init') socket.send(JSON.stringify({ type: 'connection_ack' }));
    });
  });
  let attempts = 0;
  let failNormally = false;
  let succeed = false;
  let sendGate: Promise<void> | undefined;
  await page.route('**/query', async route => {
    const { query, variables = {} } = route.request().postDataJSON();
    if (query.includes('mutation SendMessage') || query.includes('mutation CreateChatThread')) {
      attempts++;
      if (sendGate) {
        const gate = sendGate;
        sendGate = undefined;
        await gate;
      }
      if (succeed) {
        const now = new Date().toISOString();
        await route.fulfill({ json: { data: { sendMessage: {
          ID: 'sent-message', roomID: 'parent1', content: variables.content,
          user: { ID: 'u1', name: 'テスト', accountID: 'test', avatarUrl: null },
          media: [], mentions: [], reactions: [], thread: null, stampID: null, replyTo: null,
          createdAt: now, updatedAt: now, isMine: true,
        } } } });
      } else if (failNormally) {
        await route.fulfill({ json: { errors: [{ message: 'failed to send' }] } });
      } else {
        const original = variables.content ?? variables.title;
        await route.fulfill({ json: { errors: [{
          message: '使えない言葉が含まれているため、投稿できません。内容を直してください',
          extensions: { code: 'NG_WORD_BLOCKED', maskedTexts: [{ original, masked: original.replace(/死ね|ＲＥＳＰＯＮ|respon/g, '××××') }] },
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
  const previousInput = await input.elementHandle();
  await input.fill('  死ねとrespon  ');
  await main.getByRole('button', { name: '送信', exact: true }).click();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await expect(modal.getByText('投稿できません', { exact: true })).toBeVisible();
  await expect(input).toHaveValue('  ××××と××××  ');
  await expect(main.getByText(/使えない言葉/)).toHaveCount(0);
  expect(attempts).toBe(1);
  await expect(modal.getByRole('button', { name: '閉じる' })).toBeFocused();
  if (closeWith === 'enter') await page.keyboard.press('Enter');
  else await modal.getByRole('button', { name: '閉じる' }).click();
  await expect(modal).toHaveCount(0);
  await expect(input).toHaveValue('  ××××と××××  ');
  expect(attempts).toBe(1);

  // Preserve the same textarea across rejection and modal close. CDP
  // composition below tests DOM behavior, not macOS's native input menu.
  await expect(input).toBeFocused();
  expect(await previousInput!.evaluate((element) => element.isConnected)).toBe(true);
  await expect(input).toBeEditable();
  const switchKeysUnblocked = await input.evaluate((element) => {
    return ['Lang1', 'Lang2'].map((code) => element.dispatchEvent(new KeyboardEvent('keydown', {
      key: code === 'Lang1' ? 'KanaMode' : 'Eisu', code, bubbles: true, cancelable: true,
    })));
  });
  expect(switchKeysUnblocked).toEqual([true, true]);
  const ime = await page.context().newCDPSession(page);
  await ime.send('Input.imeSetComposition', { text: 'かな', selectionStart: 2, selectionEnd: 2 });
  // Safari can report isComposing=false on the Enter that confirms conversion.
  await input.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 229, isComposing: false, bubbles: true });
  expect(attempts).toBe(1);
  await ime.send('Input.insertText', { text: 'かな' });
  await expect(input).toHaveValue('  ××××と××××  かな');
  await ime.detach();

  // Other send failures keep the draft and use the existing inline error.
  failNormally = true;
  await input.fill('普通の文章');
  await main.getByRole('button', { name: '送信', exact: true }).click();
  await expect(main.getByText('メッセージの送信に失敗しました。時間をおいてから再度お試しください。')).toBeVisible();
  await expect(input).toHaveValue('普通の文章');
  await expect(modal).toHaveCount(0);

  // Submission stays locked while the same textarea remains editable. New
  // draft text must survive the successful response for the previous message.
  failNormally = false;
  succeed = true;
  let releaseSend!: () => void;
  sendGate = new Promise<void>(resolve => { releaseSend = resolve; });
  await input.fill('送信する本文');
  await main.getByRole('button', { name: '送信', exact: true }).click();
  await expect.poll(() => attempts).toBe(3);
  await expect(input).toBeEditable();
  await input.fill('待機中に書いた次の文章');
  await input.press('Enter');
  expect(attempts).toBe(3);
  releaseSend();
  await expect(main.getByText('送信する本文', { exact: true })).toBeVisible();
  await expect(input).toHaveValue('待機中に書いた次の文章');
  expect(await previousInput!.evaluate(element => element.isConnected)).toBe(true);
  succeed = false;

  await main.getByRole('button', { name: 'スレッドを作成', exact: true }).click();
  await page.getByLabel('タイトル', { exact: true }).fill('responの相談');
  await page.locator('section[aria-labelledby]').getByRole('button', { name: 'スレッドを作成', exact: true }).click();
  await expect(modal).toBeVisible();
  await expect(page.getByLabel('タイトル', { exact: true })).toHaveValue('××××の相談');
  await modal.getByRole('button', { name: '閉じる' }).click();

});

}
