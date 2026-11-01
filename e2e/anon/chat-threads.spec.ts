import { test, expect } from '@playwright/test';

test('チャットからスレッドを作成し、案内と一覧から開いて会話・変更できる', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('space_user_token','thread-ui-test'));
  const user = { ID: 'u1', name: 'テスト', accountID: 'test', avatarUrl: null };
  const now = '2026-11-01T10:00:00+09:00';
  const thread = { roomID: 'thread1', parentRoomID: 'parent1', title: '課題の相談', isClosed: false, canManage: true, canWrite: true, createdAt: now, updatedAt: now, messageCount: 0, unreadCount: 0, lastMessageAt: null as string | null };
  type MessageFixture = { ID: string; roomID: string; user: typeof user; content: string; media: never[]; createdAt: string; updatedAt: string; isMine: boolean; mentions: never[]; thread: typeof thread | null };
  const messages: Record<string, MessageFixture[]> = { parent1: [], thread1: [] };
  let created = false;
  let sentRoom: unknown;
  let reportedTarget: unknown;
  const subscriptions: Array<{id: string; room: string; query: string; send: (value: string) => void}> = [];
  const broadcast = (field: string, room: string, message: MessageFixture) => {
    for (const entry of subscriptions) if (entry.room === room && entry.query.includes(field)) entry.send(JSON.stringify({id: entry.id, type:'next', payload:{data:{[field]: message}}}));
  };
  await page.routeWebSocket('**/query', socket => {
    socket.onMessage(raw => {
      const data = JSON.parse(String(raw));
      if (data.type === 'connection_init') socket.send(JSON.stringify({type:'connection_ack'}));
      if (data.type === 'subscribe') subscriptions.push({id:data.id, room:data.payload.variables.roomID, query:data.payload.query, send: value => socket.send(value)});
    });
  });
  await page.route('**/query', async route => {
    const {query, variables:v = {}} = route.request().postDataJSON();
    let data: unknown = {};
    if (query.includes('mutation CreateChatThread')) {
      created = true; thread.title = v.title;
      messages.thread1.push({ID:'other1',roomID:'thread1',user:{...user,ID:'u2',name:'相手'},content:'相手の会話',media:[],createdAt:now,updatedAt:now,isMine:false,mentions:[],thread:null});
      const announcement: MessageFixture = {ID:'a1',roomID:'parent1',user,content:'スレッドを作成しました',media:[],createdAt:now,updatedAt:now,isMine:true,mentions:[],thread:{...thread}};
      messages.parent1.push(announcement);broadcast('messageAdded','parent1',announcement);
      data = {createChatThread:{...thread}};
    } else if (query.includes('mutation UpdateChatThread')) {
      if(v.title !== undefined) thread.title=v.title;
      if(v.closed !== undefined) {thread.isClosed=v.closed;thread.canWrite=!v.closed;}
      messages.parent1[0].thread = {...thread};broadcast('messageUpdated','parent1',messages.parent1[0]);
      data={updateChatThread:{...thread}};
    } else if (query.includes('query ChatThreadList')) data={chatThreads:created?[{...thread}]:[]};
    else if (query.includes('query ChatThreadDetail')) data={chatThread:created?{...thread}:null};
    else if (query.includes('query GetRoom')) data={room:{ID:v.id,name:v.id==='parent1'?'コミュニティ':thread.title,type:'community',user:[],isMessagingDisabled:false,lastReadAt:null,lastReadMessageID:null,unreadCount:0}};
    else if (query.includes('query ListMessages')) data={messages:{items:messages[v.roomID] ?? [],hasMoreBefore:false,hasMoreAfter:false}};
    else if (query.includes('mutation SendMessage')) {
      sentRoom=v.roomID;
      const msg:MessageFixture={ID:'m1',roomID:v.roomID,user,content:v.content,media:[],createdAt:now,updatedAt:now,isMine:true,mentions:[],thread:null};
      messages[v.roomID].push(msg);thread.messageCount++;data={sendMessage:msg};
    } else if(query.includes('mutation CreateReport')) {reportedTarget=v.input;data={createReport:{ID:'report1'}};}
    else if(query.includes('MarkRoomAsRead')) data={markRoomAsRead:true};
    await route.fulfill({json:{data}});
  });
  await page.route('**/thread-ui-test', route => route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="ja"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>スレッドUIテスト</title></head><body><div id="root"></div><script type="module">
    import RefreshRuntime from '/@react-refresh';
    RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
    await import('/e2e/fixtures/thread-harness.js');
  </script></body></html>`}));
  await page.goto('/thread-ui-test');
  const main = page.getByRole('main');
  await main.getByPlaceholder('メッセージを入力...').fill('親チャットの下書き');
  await main.getByRole('button', {name:'チャットに追加'}).click();
  await page.getByRole('menuitem', {name:'スレッドを作成'}).click();
  await page.getByLabel('タイトル', {exact:true}).fill('課題の相談');
  await page.getByRole('button', {name:'スレッドを作成', exact:true}).click();
  const panel = page.locator('section[aria-labelledby]');
  await expect(panel.getByRole('heading', {name:'課題の相談'})).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(main).toBeVisible();
  await expect(main.getByPlaceholder('メッセージを入力...')).toHaveValue('親チャットの下書き');
  const parentBox = await main.boundingBox();
  const panelBox = await panel.boundingBox();
  expect(parentBox!.x + parentBox!.width).toBeLessThanOrEqual(panelBox!.x + 1);
  await panel.getByPlaceholder('メッセージを入力...').fill('スレッド内の会話');
  await panel.getByRole('button', {name:'送信', exact:true}).click();
  await expect(panel.getByText('スレッド内の会話', {exact:true})).toBeVisible();
  expect(sentRoom).toBe('thread1');
  await expect(main.locator('[data-message-id="a1"]').getByText('1件のメッセージ', {exact:false})).toBeVisible();
  const otherMessage = panel.locator('[data-message-id="other1"]');
  await otherMessage.hover();
  await otherMessage.getByRole('button', {name:'メッセージの操作'}).click();
  await panel.getByRole('button', {name:'通報', exact:true}).click();
  await expect(panel.getByRole('heading', {name:'メッセージを通報する'})).toBeVisible();
  await panel.getByRole('button', {name:'通報する', exact:true}).click();
  await expect(panel.getByRole('heading', {name:'メッセージを通報する'})).toHaveCount(0);
  expect(reportedTarget).toMatchObject({targetType:'MESSAGE', targetID:'other1'});
  await page.screenshot({path:test.info().outputPath('threads-desktop.png')});
  await panel.getByRole('button', {name:'親チャットに戻る'}).click();
  const announcement = page.locator('[data-message-id="a1"]');
  await expect(announcement.getByText('課題の相談', {exact:true}).first()).toBeVisible();
  await expect(announcement.getByRole('button', {name:'スレッド「課題の相談」を開く'})).toBeVisible();
  await expect(page.getByText('テストさんがスレッドを作成しました')).toHaveCount(0);
  await announcement.getByRole('button').click();
  await panel.getByRole('button', {name:'スレッド設定'}).click();
  await panel.getByRole('textbox', {name:'新しいタイトル'}).fill('変更後の相談');
  await panel.getByRole('button', {name:'変更', exact:true}).click();
  await expect(panel.getByRole('heading', {name:'変更後の相談'})).toBeVisible();
  await panel.getByRole('button', {name:'クローズする'}).click();
  await expect(panel.getByText('このスレッドはクローズされています。')).toBeVisible();
  await expect(panel.getByPlaceholder('メッセージを入力...')).toHaveCount(0);
  await panel.getByRole('button', {name:'親チャットに戻る'}).click();
  await main.getByRole('button', {name:'スレッド一覧'}).click();
  await panel.getByRole('button', {name:/変更後の相談/}).click();
  await panel.getByRole('button', {name:'スレッド設定'}).click();
  await panel.getByRole('button', {name:'再開する'}).click();
  await panel.getByRole('button', {name:'スレッド設定'}).click();
  await expect(panel.getByPlaceholder('メッセージを入力...')).toBeVisible();
  await page.setViewportSize({width:390, height:844});
  await expect(main).toBeHidden();
  await expect(panel.getByRole('heading', {name:'変更後の相談'})).toBeVisible();
  const mobilePanel = await panel.boundingBox();
  expect(mobilePanel!.width).toBe(390);
  const sendBox = await panel.getByRole('button', {name:'送信', exact:true}).boundingBox();
  expect(sendBox!.y + sendBox!.height).toBeLessThanOrEqual(844);
  await expect(panel.getByRole('button', {name:'チャットに追加'})).toHaveCount(0);
  await page.screenshot({path:test.info().outputPath('threads-mobile.png')});
  await panel.getByRole('button', {name:'親チャットに戻る'}).click();
  await expect(main).toBeVisible();
  await expect(main.getByPlaceholder('メッセージを入力...')).toHaveValue('親チャットの下書き');
  await page.screenshot({path:test.info().outputPath('threads-announcement-mobile.png')});
  await page.evaluate(() => document.documentElement.setAttribute('data-theme','dark'));
  await expect(announcement.getByRole('button')).toHaveCSS('background-color','rgb(30, 41, 59)');
  await page.screenshot({path:test.info().outputPath('threads-announcement-dark.png')});
});
