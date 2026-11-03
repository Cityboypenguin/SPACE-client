import { test, expect } from '@playwright/test';

const image =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 40"><rect width="800" height="40" fill="red"/></svg>',
  );
const stamps = Array.from({ length: 12 }, (_, i) => ({
  id: 'stamp:test-' + i,
  label: 'テスト' + i,
  imageUrl: image,
  displaySize: 'large',
  status: 'active',
  allowMessage: i !== 1,
  allowReaction: i !== 2,
  messageOrder: i,
  reactionOrder: 11 - i,
  version: 1,
}));

test('reactions stay small and on one line; overflow opens without moving chat', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('space_user_token', 'test-token'),
  );
  await page.route('**/query', (route) =>
    route.fulfill({ json: { data: { chatStamps: stamps } } }),
  );
  await page.goto('/e2e/fixtures/stamp-reactions.html');
  await expect(page.locator('#message-options')).toContainText('stamp:test-2');
  await expect(page.locator('#message-options')).not.toContainText(
    'stamp:test-1,',
  );
  await expect(page.locator('#reaction-options')).not.toContainText(
    'stamp:test-2,',
  );
  const container = page.locator('#container');
  const more = container.getByRole('button', { name: /ほか.*種類/ });
  await expect(more).toBeVisible();
  const before = await container.boundingBox();
  expect(before?.height).toBeLessThanOrEqual(28);
  const images = container.locator('img:visible');
  for (const img of await images.all()) {
    const box = await img.boundingBox();
    expect(box!.height).toBeLessThanOrEqual(20);
    expect(box!.width).toBeLessThanOrEqual(32);
  }
  await expect(
    container.getByText('99+', { exact: true }).first(),
  ).toBeVisible();
  await more.click();
  const dialog = page.getByRole('dialog', { name: 'リアクション一覧' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: /テスト/ })).toHaveCount(12);
  expect((await container.boundingBox())!.height).toBe(before!.height);
  await dialog
    .getByRole('button', { name: 'テスト0 120件（付けています）' })
    .click();
  expect(
    await page.evaluate(
      () => (window as unknown as { lastToggled: string }).lastToggled,
    ),
  ).toBe('stamp:test-0');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(more).toBeFocused();
  await container.evaluate((el) => {
    (el as HTMLElement).style.width = '130px';
  });
  await expect(more).toContainText('+11');
  await container.evaluate((el) => {
    (el as HTMLElement).style.width = '1000px';
  });
  await expect(more).toContainText('+8');
});

test('admin creates a draft, publishes, stops and changes usage independently', async ({
  page,
}) => {
  let rows: typeof stamps = [];
  const inputs: Record<string, unknown>[] = [];
  await page.addInitScript(() =>
    localStorage.setItem('space_admin_token', 'test-admin-token'),
  );
  await page.route('**/query', async (route) => {
    const { query, variables } = route.request().postDataJSON();
    let data: Record<string, unknown> = {};
    if (query.includes('adminStampUploadUrl'))
      data = {
        adminStampUploadUrl: {
          uploadUrl: new URL('/mock-upload', page.url()).href,
          objectKey: 'staging/chat-stamps/1/test.svg',
          headers: [],
        },
      };
    else if (query.includes('adminSaveChatStamp')) {
      const input = variables.input;
      inputs.push(input);
      if (inputs.length === 4) {
        await route.fulfill({
          json: {
            errors: [
              {
                message: '他の管理者が更新しました。一覧を再取得してください',
                extensions: { code: 'CONFLICT' },
              },
            ],
          },
        });
        return;
      }
      const row = {
        ...input,
        id: input.id ?? 'stamp:new',
        imageUrl: image,
        version: input.version + 1,
      };
      rows = [row];
      data = { adminSaveChatStamp: row };
    } else if (query.includes('adminChatStamps'))
      data = { adminChatStamps: rows };
    else if (query.includes('chatStamps'))
      data = { chatStamps: rows.filter((s) => s.status !== 'draft') };
    else if (query.includes('SearchInquiries'))
      data = { searchInquiries: { items: [], total: 0 } };
    else if (query.includes('PendingReport')) data = { pendingReportCount: 0 };
    await route.fulfill({ json: { data } });
  });
  await page.route('**/mock-upload', (route) =>
    route.fulfill({ status: 200, body: '' }),
  );
  await page.goto('/admin/chat-stamps');
  await expect(
    page.getByText('登録済みのスタンプはありません。'),
  ).toBeVisible();
  await page.getByLabel('画像', { exact: true }).setInputFiles({
    name: 'thanks.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M0 0 L64 64"/></svg>',
    ),
  });
  await page.getByLabel('名前', { exact: true }).fill('ありがとう');
  await page.getByRole('button', { name: '保存する', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('保存しました');
  expect(inputs[0].status).toBe('draft');
  await page.getByLabel('状態', { exact: true }).selectOption('active');
  await page.getByLabel('リアクションに使用できる').uncheck();
  await page.getByRole('button', { name: '保存する', exact: true }).click();
  await expect.poll(() => inputs.length).toBe(2);
  expect(inputs[1].allowMessage).toBe(true);
  expect(inputs[1].allowReaction).toBe(false);
  await expect(
    page.getByRole('button', { name: /ありがとう 公開中/ }),
  ).toBeVisible();
  await page.getByLabel('状態', { exact: true }).selectOption('inactive');
  await page.getByRole('button', { name: '保存する', exact: true }).click();
  await expect(
    page.getByRole('button', { name: /ありがとう 利用停止/ }),
  ).toBeVisible();
  expect(inputs[2].status).toBe('inactive');
  await page.getByRole('button', { name: '保存する', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    '他の管理者が更新しました。一覧を再取得してください',
  );

  await page.screenshot({
    path: test.info().outputPath('admin-stamps-desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'メニュー開閉' }).click();
  await expect
    .poll(async () =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: test.info().outputPath('admin-stamps-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
});

for (const chat of [
  { name: 'DM', path: '/dm/room-test', type: 'dm', mine: false },
  { name: '自分のDM', path: '/dm/room-test', type: 'dm', mine: true },
  {
    name: 'コミュニティ',
    path: '/community/chat/room-test',
    type: 'community',
    mine: false,
  },
]) {
  test(`${chat.name}: empty catalog hides buttons and published stamps can be used`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('space_user_token', 'chat-stamp-test');
      localStorage.setItem('space_user_id', 'u1');
      // 週1回のお知らせが画面を覆わないよう、「1週間表示しない」を選んだ状態にする。
      localStorage.setItem('weeklyNoticeHiddenAt:u1', String(Date.now()));
    });
    let published = false,
      reacted = false,
      sentStamp: string | undefined;
    const now = '2026-11-03T10:00:00+09:00';
    const message = {
      ID: 'message-test',
      roomID: 'room-test',
      user: {
        ID: chat.mine ? 'u1' : 'u2',
        name: chat.mine ? '自分' : '相手',
        accountID: chat.mine ? 'me' : 'partner',
        avatarUrl: null,
      },
      content: 'テストのメッセージ',
      media: [],
      mentions: [],
      reactions: [],
      createdAt: now,
      updatedAt: now,
      isMine: chat.mine,
    };
    await page.routeWebSocket('**/query', (socket) =>
      socket.onMessage((raw) => {
        if (JSON.parse(String(raw)).type === 'connection_init')
          socket.send(JSON.stringify({ type: 'connection_ack' }));
      }),
    );
    await page.route('**/query', async (route) => {
      const { query, variables: v = {} } = route.request().postDataJSON();
      let data: unknown = {};
      if (query.includes('chatStamps'))
        data = {
          chatStamps: published
            ? stamps.map((stamp, index) => ({
                ...stamp,
                label: index === 0 ? 'ありがとう' : stamp.label,
                allowMessage: true,
                allowReaction: true,
              }))
            : [],
        };
      else if (query.includes('query GetRoom'))
        data = {
          room: {
            ID: 'room-test',
            name: 'テストルーム',
            type: chat.type,
            user: [
              { ID: 'u1', name: '自分', accountID: 'me' },
              { ID: 'u2', name: '相手', accountID: 'partner' },
            ],
            isMessagingDisabled: false,
            isPartnerWithdrawn: false,
            unreadCount: 0,
            lastReadAt: null,
            lastReadMessageID: null,
          },
        };
      else if (query.includes('query ListMessages'))
        data = {
          messages: {
            items: [message],
            hasMoreBefore: false,
            hasMoreAfter: false,
          },
        };
      else if (query.includes('mutation AddMessageReaction')) {
        reacted = true;
        data = {
          addMessageReaction: {
            ID: message.ID,
            reactions: [{ emoji: stamps[0].id, count: 1, reactedByMe: true }],
          },
        };
      } else if (query.includes('mutation SendMessage')) {
        sentStamp = v.stampID;
        data = {
          sendMessage: {
            ...message,
            ID: 'sent-stamp',
            isMine: true,
            content: '',
            stampID: v.stampID,
          },
        };
      } else if (query.includes('MarkRoomAsRead'))
        data = { markRoomAsRead: true };
      await route.fulfill({ json: { data } });
    });
    await page.goto(chat.path);
    const stampButton = page.getByRole('button', {
      name: 'スタンプを送る',
      exact: true,
    });
    const msg = page.locator('[data-message-id="message-test"]');
    await expect(msg).toBeVisible();
    await expect(stampButton).toHaveCount(0);
    await msg.hover();
    await msg.getByRole('button', { name: 'メッセージの操作' }).click();
    await expect(
      page.getByRole('button', { name: 'リアクションを付ける', exact: true }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');
    published = true;
    await page.reload();
    await expect(stampButton).toBeVisible();
    const meatball = msg.getByRole('button', { name: 'メッセージの操作' });
    const reactionAdd = msg.getByRole('button', {
      name: 'リアクションを付ける',
      exact: true,
    });
    await page.mouse.move(0, 0);
    await expect(meatball).toHaveCSS('opacity', '0');
    await expect(reactionAdd).toHaveCSS('opacity', '0');
    await msg.hover();
    await expect(meatball).toHaveCSS('opacity', '1');
    await expect(reactionAdd).toHaveCSS('opacity', '1');
    const before = await meatball.boundingBox();
    const addBox = await reactionAdd.boundingBox();
    expect(Math.abs(before!.y - addBox!.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(before!.x - addBox!.x)).toBeLessThanOrEqual(30);
    await reactionAdd.click();
    await page.mouse.move(0, 0);
    await expect(reactionAdd).toHaveCSS('opacity', '1');
    await page
      .getByRole('button', { name: 'ありがとうを付ける', exact: true })
      .click();
    await expect.poll(() => reacted).toBe(true);
    await expect(
      msg.getByRole('button', { name: 'ありがとう 1件（付けています）' }),
    ).toBeVisible();
    const bubbleBox = await msg
      .getByText(message.content, { exact: true })
      .boundingBox();
    const chipBox = await msg
      .getByRole('button', { name: 'ありがとう 1件（付けています）' })
      .boundingBox();
    expect(
      chipBox!.y - (bubbleBox!.y + bubbleBox!.height),
    ).toBeGreaterThanOrEqual(6);
    const after = await meatball.boundingBox();
    expect(Math.abs(after!.x - before!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
    await page.screenshot({
      path: test.info().outputPath('reaction-actions.png'),
    });
    await msg.hover();
    await expect(meatball).toHaveCSS('opacity', '1');
    await meatball.click();
    await expect(
      page.getByRole('group', { name: 'リアクションを選ぶ' }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');
    await reactionAdd.click();
    await expect(
      page.getByRole('group', { name: 'リアクションを選ぶ' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(reactionAdd).toBeFocused();
    await reactionAdd.click();
    const picker = page.getByRole('group', { name: 'リアクションを選ぶ' });
    const columns = () =>
      picker.evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(/\s+/).length,
      );
    await expect.poll(columns).toBe(4);
    await page.setViewportSize({ width: 320, height: 720 });
    await expect.poll(columns).toBeLessThanOrEqual(3);
    const pickerBounds = await picker.boundingBox();
    expect(pickerBounds!.x).toBeGreaterThanOrEqual(0);
    expect(pickerBounds!.x + pickerBounds!.width).toBeLessThanOrEqual(320);
    expect(pickerBounds!.y).toBeGreaterThanOrEqual(0);
    expect(pickerBounds!.y + pickerBounds!.height).toBeLessThanOrEqual(720);
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1280, height: 720 });
    await stampButton.click();
    await page
      .getByRole('button', { name: 'ありがとうを送る', exact: true })
      .click();
    await expect.poll(() => sentStamp).toBe(stamps[0].id);
    await expect(page.locator('[data-message-id="sent-stamp"]')).toBeVisible();
  });
}
