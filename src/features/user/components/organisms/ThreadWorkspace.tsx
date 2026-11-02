import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { createThread, getThread, hasUnreadThreads, listThreads, updateThread } from '../../api/thread';
import { useUnreadSubscription } from '../../hooks/useUnreadSubscription';
import { subscribeToGraphQL } from '../../../../lib/graphqlWs';
import { useThreadActions } from '../../hooks/useThreadActions';
import { CourseChatTab } from './CourseChatTab';
import { toUserMessage } from '../../../../lib/errorMessages';
import styles from './ThreadWorkspace.module.css';

const CHAT_THREAD_CHANGED_SUBSCRIPTION = `
  subscription ChatThreadChanged($parentRoomID: ID!) {
    chatThreadChanged(parentRoomID: $parentRoomID)
  }
`;

export function ThreadListButton({ parentRoomID, compact = false }: { parentRoomID: string; compact?: boolean }) {
  const actions = useThreadActions();
  const { data: unread, mutate: refreshUnread } = useSWR(
    parentRoomID ? ['thread-unread', parentRoomID] : null,
    // 新着は useUnreadSubscription で分かるので、定期の確認はリアルタイムが切れていたときの保険。
    () => hasUnreadThreads(parentRoomID), { refreshInterval: 2 * 60 * 1000, dedupingInterval: 500 },
  );
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useUnreadSubscription(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => { void refreshUnread(); }, 150);
  });
  useEffect(() => () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); }, []);
  return <button type="button" className={styles.headerButton} data-thread-list-button onClick={actions.list} aria-label={unread ? 'スレッド一覧（未読あり）' : 'スレッド一覧'} title="スレッド一覧">
    {unread && <span className={styles.unreadDot} data-testid="thread-unread-dot" aria-hidden="true" />}
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M4 4h16v12H9l-5 4V4Z" strokeLinejoin="round" /><path d="M8 8h8M8 12h5" strokeLinecap="round" />
    </svg>
    <span className={styles.headerLabel} hidden={compact}>スレッド</span>
  </button>;
}

type Props = { parentRoomID: string; writable: boolean; children: ReactNode };

export function ThreadWorkspace({ parentRoomID, writable, children }: Props) {
  const [params] = useSearchParams();
  const activeID = params.get('thread');
  const mode = params.get('threadView');
  const isOpen = !!activeID || mode === 'create' || mode === 'list';
  return <div className={`${styles.workspace} ${isOpen ? styles.workspaceOpen : ''}`}>
    <div className={styles.main}>{children}</div>
    {isOpen && <ThreadPanel key={`${parentRoomID}:${activeID}:${mode}`} parentRoomID={parentRoomID} writable={writable} />}
  </div>;
}

function ThreadPanel({ parentRoomID, writable }: Omit<Props, 'children'>) {
  const [params] = useSearchParams();
  const navigation = useThreadActions();
  const activeID = params.get('thread');
  const mode = params.get('threadView');
  const isCreating = mode === 'create';
  const isListing = mode === 'list';
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 一覧も詳細も、スレッドの作成・変更・新着の知らせ（chatThreadChanged）を受けて取り直す。
  // 定期の取得は、知らせが届かなかったとき（削除など知らせの無い変更を含む）の保険。
  const { data: threads, error: listError, mutate: refreshList } = useSWR(
    isListing ? ['chat-threads', parentRoomID, offset] : null,
    () => listThreads(parentRoomID, offset), { refreshInterval: 2 * 60 * 1000 },
  );
  const { data: thread, error: threadError, mutate: refreshThread } = useSWR(
    activeID ? ['chat-thread', activeID] : null,
    () => getThread(activeID!), { refreshInterval: 2 * 60 * 1000 },
  );
  const listRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshRef = useRef({ refreshList, refreshThread });
  useEffect(() => { refreshRef.current = { refreshList, refreshThread }; }, [refreshList, refreshThread]);
  useEffect(() => {
    if (!isListing && !activeID) return;
    let connectedBefore = false;
    const unsubscribe = subscribeToGraphQL<{ chatThreadChanged: string }>(
      CHAT_THREAD_CHANGED_SUBSCRIPTION,
      { parentRoomID },
      (data) => {
        if (activeID && data.chatThreadChanged === activeID) void refreshRef.current.refreshThread();
        if (!isListing || listRefreshTimer.current) return;
        // 賑やかなスレッドで知らせが途切れなく届いても取り直しが止まらないよう、最初の1件で予約し、3秒に1回までにする。
        listRefreshTimer.current = setTimeout(() => {
          listRefreshTimer.current = null;
          void refreshRef.current.refreshList();
        }, 3000);
      },
      (err) => console.error('[ThreadPanel] chatThreadChanged subscription error:', err),
      // 繋ぎ直したときは、切れていた間の変更を取りこぼしているかもしれない。最初の接続は開いたときの取得で足りる。
      () => {
        if (!connectedBefore) { connectedBefore = true; return; }
        if (isListing) void refreshRef.current.refreshList();
        if (activeID) void refreshRef.current.refreshThread();
      },
    );
    return () => {
      unsubscribe();
      if (listRefreshTimer.current) clearTimeout(listRefreshTimer.current);
      listRefreshTimer.current = null;
    };
  }, [parentRoomID, isListing, activeID]);

  useEffect(() => {
    if (!isCreating) headingRef.current?.focus({ preventScroll: true });
  }, [isCreating]);

  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (busy || !title.trim() || !writable) return;
    setBusy(true);
    setError('');
    try {
      const created = await createThread(parentRoomID, title.trim());
      navigation.open(created.roomID);
      await refreshList();
    } catch (cause) {
      setError(toUserMessage(cause, 'スレッドを作成できませんでした。'));
    } finally { setBusy(false); }
  };
  const change = async (values: { title?: string; closed?: boolean }) => {
    if (!activeID || busy) return;
    setBusy(true);
    setError('');
    try {
      await updateThread(activeID, values);
      await refreshThread();
      await refreshList();
    } catch (cause) {
      setError(toUserMessage(cause, 'スレッドを変更できませんでした。'));
    } finally { setBusy(false); }
  };
  const validThread = thread?.parentRoomID === parentRoomID ? thread : null;
  const heading = isCreating ? 'スレッドを作成' : isListing ? 'スレッド' : validThread?.title ?? 'スレッド';

  return <section className={styles.panel} aria-labelledby={titleId}>
      <header className={styles.panelHeader}>
        <button type="button" className={styles.iconButton} onClick={navigation.back} aria-label={navigation.backLabel} title={navigation.backLabel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m14 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className={styles.headingBlock}>
          <span className={styles.eyebrow}>{activeID ? 'スレッド' : 'チャット'}</span>
          <h2 id={titleId} ref={headingRef} tabIndex={-1}>{heading}</h2>
        </div>
        {activeID && <ThreadListButton parentRoomID={parentRoomID} compact />}
        {validThread?.canManage && writable && <button type="button" className={styles.iconButton} onClick={() => setSettingsOpen(value => !value)} aria-label="スレッド設定" aria-expanded={settingsOpen}>⋯</button>}
      </header>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {isCreating ? <div className={styles.panelBody}>
        <p className={styles.description}>話題ごとに会話を分けましょう。作成すると、親チャットにスレッドへの案内が表示されます。</p>
        {writable ? <form className={styles.form} onSubmit={submit}>
          <label htmlFor={`${titleId}-input`}>タイトル</label>
          <input id={`${titleId}-input`} value={title} onChange={event => setTitle(event.target.value)} maxLength={100} required autoFocus disabled={busy} placeholder="どんな話をしますか？" />
          <span className={styles.characterCount}>{title.length} / 100</span>
          <button className={styles.primaryButton} type="submit" disabled={busy || !title.trim()}>{busy ? '作成中…' : 'スレッドを作成'}</button>
        </form> : <p className={styles.notice}>現在このチャットではスレッドを作成できません。</p>}
      </div> : isListing ? <div className={styles.panelBody}>
        <div className={styles.listHeading}><span>最近のスレッド</span>{writable && <button type="button" className={styles.textButton} onClick={navigation.create}>＋ 新規作成</button>}</div>
        {listError ? <p role="alert">{toUserMessage(listError, '一覧を取得できませんでした。')}</p> : !threads ? <p className={styles.description}>読み込み中…</p> : <>
          {threads.length === 0 && <div className={styles.empty}><strong>まだスレッドはありません</strong><p>入力欄のスレッド作成ボタンから、新しい話題を始められます。</p></div>}
          <ul className={styles.list}>{threads.map(item => <li key={item.roomID}>
            <button className={styles.listItem} type="button" onClick={() => navigation.open(item.roomID)}>
              <span className={styles.listItemTop}><strong>{item.title}</strong><span aria-hidden="true">›</span></span>
              <span className={styles.meta}>{item.messageCount}件のメッセージ{item.isClosed ? ' · クローズ済み' : ''} · {new Date(item.lastMessageAt || item.createdAt).toLocaleDateString('ja-JP')}</span>
              {item.unreadCount > 0 && <span className={styles.badge}>未読 {item.unreadCount}件</span>}
            </button>
          </li>)}</ul>
          {(offset > 0 || threads.length === 20) && <nav className={styles.pagination} aria-label="スレッド一覧のページ">
            <button type="button" disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - 20))}>前へ</button>
            <button type="button" disabled={threads.length < 20} onClick={() => setOffset(value => value + 20)}>次へ</button>
          </nav>}
        </>}
      </div> : threadError ? <p className={styles.error} role="alert">{toUserMessage(threadError, 'スレッドを取得できませんでした。')}</p> : thread === undefined ? <p className={styles.panelBody}>読み込み中…</p> : !validThread ? <p className={styles.panelBody}>スレッドが見つかりません。</p> : <>
        {settingsOpen && validThread.canManage && writable && <div className={styles.settings}>
          <form className={styles.form} onSubmit={event => { event.preventDefault(); void change({ title: String(new FormData(event.currentTarget).get('title')) }); }}>
            <label htmlFor={`${titleId}-rename`}>タイトル</label>
            <div className={styles.renameRow}><input id={`${titleId}-rename`} name="title" aria-label="新しいタイトル" defaultValue={validThread.title} key={validThread.title} maxLength={100} required disabled={busy} /><button type="submit" className={styles.secondaryButton} disabled={busy}>変更</button></div>
          </form>
          <button className={styles.textButton} type="button" disabled={busy} onClick={() => change({ closed: !validThread.isClosed })}>{validThread.isClosed ? '再開する' : 'クローズする'}</button>
        </div>}
        {!validThread.canWrite && <p className={styles.notice}>{validThread.isClosed ? 'このスレッドはクローズされています。' : '現在このスレッドは閲覧のみ可能です。'}</p>}
        <div className={styles.chat}><CourseChatTab key={activeID} roomId={activeID!} roomWritable={validThread.canWrite && writable} /></div>
      </>}
  </section>;
}
