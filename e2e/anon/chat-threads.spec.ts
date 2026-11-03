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
  let hasUnread = true;
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
      const otherAnnouncement:MessageFixture={...announcement,ID:'a2',user:{...user,ID:'u2',name:'相手'},isMine:false,thread:{...thread,roomID:'thread-other',title:'別の話題'}};
      messages.parent1.push(otherAnnouncement);broadcast('messageAdded','parent1',otherAnnouncement);
      data = {createChatThread:{...thread}};
    } else if (query.includes('mutation UpdateChatThread')) {
      if(v.title !== undefined) thread.title=v.title;
      if(v.closed !== undefined) {thread.isClosed=v.closed;thread.canWrite=!v.closed;}
      messages.parent1[0].thread = {...thread};broadcast('messageUpdated','parent1',messages.parent1[0]);
      data={updateChatThread:{...thread}};
    } else if (query.includes('query HasUnreadChatThreads')) data={hasUnreadChatThreads:hasUnread};
    else if (query.includes('query MessageReactionEmojis')) data={messageReactionEmojis:[]};
    else if (query.includes('query ChatThreadList')) data={chatThreads:created?[{...thread}]:[]};
    else if (query.includes('query ChatThreadDetail')) data={chatThread:created?{...thread,...(v.roomID === 'thread-other' ? {roomID:'thread-other',title:'別の話題'} : {})}:null};
    else if (query.includes('query GetRoom')) data={room:{ID:v.id,name:v.id==='parent1'?'コミュニティ':thread.title,type:'community',user:[],isMessagingDisabled:false,lastReadAt:null,lastReadMessageID:null,unreadCount:v.id==='thread1'&&hasUnread?1:0}};
    else if (query.includes('query ListMessages')) data={messages:{items:messages[v.roomID] ?? [],hasMoreBefore:false,hasMoreAfter:false}};
    else if (query.includes('mutation SendMessage')) {
      sentRoom=v.roomID;
      const msg:MessageFixture={ID:'m1',roomID:v.roomID,user,content:v.content,media:[],createdAt:now,updatedAt:now,isMine:true,mentions:[],thread:null};
      messages[v.roomID].push(msg);thread.messageCount++;data={sendMessage:msg};
      // サーバーはスレッドへの投稿で親チャットの案内を更新して配る。
      if(v.roomID==='thread1'){messages.parent1[0].thread={...thread};broadcast('messageUpdated','parent1',messages.parent1[0]);}
    } else if(query.includes('mutation CreateReport')) {reportedTarget=v.input;data={createReport:{ID:'report1'}};}
    else if(query.includes('MarkRoomAsRead')) {if(v.roomID==='thread1') hasUnread=false;data={markRoomAsRead:true};}
    await route.fulfill({json:{data}});
  });
  await page.route(/\/thread-ui-test(?:\?.*)?$/, route => route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="ja"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>スレッドUIテスト</title></head><body><div id="root"></div><script type="module">
    import RefreshRuntime from '/@react-refresh';
    RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
    await import('/e2e/fixtures/thread-harness.js');
  </script></body></html>`}));
  await page.goto('/thread-ui-test');
  const main = page.getByRole('main');
  await expect(main.getByTestId('thread-unread-dot')).toBeVisible();
  await main.getByPlaceholder('メッセージを入力...').fill('親チャットの下書き');
  const fileChooserPromise = page.waitForEvent('filechooser');
  await main.getByRole('button', {name:'ファイルを添付',exact:true}).click();
  expect((await fileChooserPromise).isMultiple()).toBe(true);
  await expect(page.getByRole('menu')).toHaveCount(0);
  await main.getByRole('button', {name:'スレッドを作成',exact:true}).click();
  await page.getByLabel('タイトル', {exact:true}).fill('課題の相談');
  const panel = page.locator('section[aria-labelledby]');
  await panel.getByRole('button', {name:'スレッドを作成', exact:true}).click();
  await expect(panel.getByRole('heading', {name:'課題の相談'})).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(main).toBeVisible();
  await expect(main.getByTestId('thread-unread-dot')).toHaveCount(0);
  await expect(main.getByPlaceholder('メッセージを入力...')).toHaveValue('親チャットの下書き');
  const ownCard = main.locator('[data-message-id="a1"]').getByRole('button');
  const otherCard = main.locator('[data-message-id="a2"]').getByRole('button');
  await expect(ownCard).toBeVisible();
  await expect(otherCard).toBeVisible();
  const ownCardBox = await ownCard.boundingBox();
  const otherCardBox = await otherCard.boundingBox();
  expect(ownCardBox!.x + ownCardBox!.width).toBeGreaterThan(otherCardBox!.x + otherCardBox!.width);
  await expect(main.locator('[data-message-id="a1"]').getByText('課題の相談',{exact:true}).first()).toHaveCSS('background-color','rgb(59, 130, 246)');
  await expect(main.locator('[data-message-id="a2"]').getByText('別の話題',{exact:true}).first()).toHaveCSS('background-color','rgb(241, 245, 249)');
  await expect(main.locator('[data-message-id="a1"]').getByText('テスト',{exact:true})).toHaveCount(0);
  const announcementName = main.locator('[data-message-id="a2"]').getByText('相手',{exact:true});
  const normalName = panel.locator('[data-message-id="other1"]').getByText('相手',{exact:true});
  await expect(announcementName).toHaveCSS('color',await normalName.evaluate(element => getComputedStyle(element).color));
  await expect(announcementName).toHaveCSS('font-size',await normalName.evaluate(element => getComputedStyle(element).fontSize));
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
  await main.getByRole('button', {name:/^スレッド一覧/}).click();
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
  await expect(panel.getByRole('button', {name:'スレッドを作成',exact:true})).toHaveCount(0);
  await page.screenshot({path:test.info().outputPath('threads-mobile.png')});
  // Opening the list from inside a thread must return to that same thread.
  await panel.getByRole('button', {name:'スレッド一覧', exact:true}).click();
  await panel.getByRole('button', {name:'スレッドに戻る'}).click();
  await expect(panel.getByRole('heading', {name:'変更後の相談'})).toBeVisible();
  // A thread opened from the list returns to that list, including on mobile.
  await panel.getByRole('button', {name:'スレッド一覧に戻る'}).click();
  await expect(panel.getByRole('heading', {name:'スレッド', exact:true})).toBeVisible();
  await expect(main).toBeHidden();
  // Cancelling creation from the list also returns to the list.
  await panel.getByRole('button', {name:'＋ 新規作成'}).click();
  await panel.getByRole('button', {name:'スレッド一覧に戻る'}).click();
  await expect(panel.getByRole('heading', {name:'スレッド', exact:true})).toBeVisible();
  await panel.getByRole('button', {name:'親チャットに戻る'}).click();
  await expect(main).toBeVisible();
  // A card opened from the chat returns directly to that chat.
  await announcement.getByRole('button').click();
  await expect(panel.getByRole('button', {name:'親チャットに戻る'})).toBeVisible();
  await panel.getByRole('button', {name:'親チャットに戻る'}).click();
  await expect(main).toBeVisible();
  await expect(main.getByPlaceholder('メッセージを入力...')).toHaveValue('親チャットの下書き');
  await page.screenshot({path:test.info().outputPath('threads-announcement-mobile.png')});
  await page.evaluate(() => document.documentElement.setAttribute('data-theme','dark'));
  await expect(announcement.getByRole('button')).toHaveCSS('background-color','rgb(30, 41, 59)');
  await page.screenshot({path:test.info().outputPath('threads-announcement-dark.png')});
  // The red dot also appears on mobile when another thread receives a message.
  hasUnread = true;
  await page.evaluate(async () => {
    const modulePath = '/src/features/user/hooks/useUnreadSubscription.ts';
    const { emitRoomChanged } = await import(modulePath);
    emitRoomChanged({ roomID:'thread-other', hasNewMessage:true });
  });
  await expect(main.getByTestId('thread-unread-dot')).toBeVisible();
  await expect(main.getByRole('button', {name:'スレッド一覧（未読あり）'})).toBeVisible();
  // Reloading the thread entry preserves its in-app list origin.
  await main.getByRole('button', {name:/^スレッド一覧/}).click();
  await panel.getByRole('button', {name:/変更後の相談/}).click();
  await page.reload();
  await expect(panel.getByRole('button', {name:'スレッド一覧に戻る'})).toBeVisible();
  await panel.getByRole('button', {name:'スレッド一覧に戻る'}).click();
  await expect(panel.getByRole('heading', {name:'スレッド', exact:true})).toBeVisible();
  await panel.getByRole('button', {name:'親チャットに戻る'}).click();
  await expect(main).toBeVisible();
  // Direct links have no entry history: stay in the app and preserve other query parameters.
  await page.goto('/thread-ui-test?thread=thread1&messageID=keep');
  await panel.getByRole('button', {name:'親チャットに戻る'}).click();
  await expect(main).toBeVisible();
  expect(new URL(page.url()).searchParams.get('messageID')).toBe('keep');
  expect(new URL(page.url()).searchParams.has('thread')).toBe(false);
  // Switching cards in the parent chat must not make the previous thread the back target.
  await page.setViewportSize({width:1280, height:900});
  await announcement.getByRole('button').click();
  await expect(panel.getByRole('heading', {name:'変更後の相談'})).toBeVisible();
  await otherCard.click();
  await expect(panel.getByRole('heading', {name:'別の話題'})).toBeVisible();
  await expect(panel.getByRole('button', {name:'親チャットに戻る'})).toBeVisible();
  // Reopening the same card must not add another back destination either.
  await otherCard.click();
  await page.reload();
  await panel.getByRole('button', {name:'親チャットに戻る'}).click();
  await expect(panel).toHaveCount(0);
  expect(new URL(page.url()).searchParams.has('thread')).toBe(false);
  expect(new URL(page.url()).searchParams.get('messageID')).toBe('keep');

});
