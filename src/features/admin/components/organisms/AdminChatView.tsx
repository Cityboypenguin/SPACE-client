import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { listRoomMessages, adminDeleteMessage, adminMessagePageSize, type Message } from '../../api/communities';
import { ChatDateSeparator } from '../../../../components/atoms/ChatDateSeparator';
import { AdminChatMessage } from '../molecules/AdminChatMessage';
import chatStyles from '../../../user/components/ChatRoom.module.css';

type Props = {
  roomID: string;
  onOpenThread: (roomID: string) => void;
  // 一覧の高さ。ページの中に埋め込むので、ユーザー側のように画面いっぱいにはしない。
  height?: string;
};

// 授業・コミュニティ・スレッドのチャット履歴を、ユーザー側のチャット画面と同じ見た目で表示する。
// 上端までスクロールすると過去のメッセージを読み込む。
export const AdminChatView = ({ roomID, onOpenThread, height = '70vh' }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [hasMoreBefore, setHasMoreBefore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [deletingID, setDeletingID] = useState<string | null>(null);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const loadingOlderRef = useRef(false);
  // 過去のメッセージを上に足したあと、見ていた位置がずれないように戻すための記録
  const restoreFromBottom = useRef<number | null>(null);
  const scrolledInitially = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void listRoomMessages(roomID)
      .then((data) => {
        if (cancelled) return;
        setMessages(data.messages.items);
        setHasMoreBefore(data.messages.hasMoreBefore);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setError('メッセージの取得に失敗しました');
      });
    return () => {
      cancelled = true;
    };
  }, [roomID]);

  const loadOlder = useCallback(async () => {
    const oldest = messages[0]?.ID;
    if (!oldest || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const data = await listRoomMessages(roomID, adminMessagePageSize, oldest);
      const list = listRef.current;
      if (list) restoreFromBottom.current = list.scrollHeight - list.scrollTop;
      setMessages((prev) => [...data.messages.items, ...prev]);
      setHasMoreBefore(data.messages.hasMoreBefore);
    } catch {
      setError('過去のメッセージの取得に失敗しました');
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [roomID, messages]);

  // 最初は最新（一番下）を見せる。過去分を足したときは、見ていたメッセージの位置を保つ。
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !loaded) return;
    if (!scrolledInitially.current) {
      scrolledInitially.current = true;
      list.scrollTop = list.scrollHeight;
      return;
    }
    if (restoreFromBottom.current !== null) {
      list.scrollTop = list.scrollHeight - restoreFromBottom.current;
      restoreFromBottom.current = null;
    }
  }, [messages, loaded]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const list = listRef.current;
    if (!sentinel || !list || !hasMoreBefore || !loaded) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadOlder();
      },
      { root: list, rootMargin: '200px 0px 0px 0px', threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreBefore, loaded, loadOlder]);

  const handleDelete = async (message: Message) => {
    if (!window.confirm('このメッセージを削除しますか？')) return;
    setDeletingID(message.ID);
    try {
      await adminDeleteMessage(message.roomID, message.ID);
      setMessages((prev) => prev.filter((m) => m.ID !== message.ID));
    } catch {
      setError('メッセージの削除に失敗しました');
    } finally {
      setDeletingID(null);
    }
  };

  // 引用をクリックしたら返信先へ移る。読み込んでいない古いメッセージには移れない。
  const jumpToMessage = (messageID: string) => {
    const target = listRef.current?.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(messageID)}"]`);
    if (!target) {
      window.alert('返信先のメッセージはまだ読み込まれていません。上へスクロールして過去のメッセージを読み込んでください。');
      return;
    }
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    target.animate(
      [{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 18%, transparent)' }, { backgroundColor: 'transparent' }],
      { duration: 1600, easing: 'ease-out' },
    );
  };

  return (
    <div
      className={chatStyles.messageListWrapper}
      // 親が縦並びの flex でも高さを保つよう flex は効かせない（伸び縮みすると一覧がスクロールせず、過去分を全部読み込んでしまう）
      style={{ height, flex: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)' }}
    >
      <div className={chatStyles.messageList} ref={listRef}>
        <div ref={topSentinelRef} className={chatStyles.scrollSentinel} />
        {loadingOlder && <p className={chatStyles.loadingText}>読み込み中...</p>}
        {loaded && !hasMoreBefore && messages.length > 0 && (
          <p className={chatStyles.loadingText}>これより前のメッセージはありません</p>
        )}
        {error && <p className={chatStyles.errorText}>{error}</p>}
        {!loaded && !error && <p className={chatStyles.loadingText}>読み込み中...</p>}
        {loaded && messages.length === 0 && <p className={chatStyles.loadingText}>メッセージはありません</p>}

        {messages.map((msg, index) => (
          <div key={msg.ID} className={chatStyles.messageGroup}>
            <ChatDateSeparator currentCreatedAt={msg.createdAt} prevCreatedAt={messages[index - 1]?.createdAt} />
            <AdminChatMessage
              msg={msg}
              onDelete={() => void handleDelete(msg)}
              deleting={deletingID === msg.ID}
              onOpenThread={onOpenThread}
              onJumpToMessage={jumpToMessage}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
