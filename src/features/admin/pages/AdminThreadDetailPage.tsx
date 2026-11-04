import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { listRoomMessages, adminDeleteMessage, adminMessagePageSize, type Message } from '../api/communities';
import { getChatThread, type AdminThread } from '../api/threads';
import { reactionLabel } from '../../user/constants/reactionStamps';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { storageUrl } from '../../../lib/storage';
import styles from '../styles/AdminShared.module.css';

// 授業チャット・コミュニティのスレッド1件のメッセージを表示する。
// /admin/courses/:id/threads/:threadID と /admin/communities/:id/threads/:threadID の両方で使い、
// 戻り先は URL の親部分から決める。
export const AdminThreadDetailPage = () => {
  const { threadID } = useParams<{ threadID: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const parentPath = location.pathname.replace(/\/threads\/[^/]+$/, '');

  const [thread, setThread] = useState<AdminThread | null>(
    (location.state as { thread?: AdminThread })?.thread ?? null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [oldestMessageID, setOldestMessageID] = useState<string | null>(null);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const loadingOlderRef = useRef(false);
  const [error, setError] = useState('');
  const [messagesError, setMessagesError] = useState('');

  const fetchThread = useCallback(async () => {
    if (!threadID) return;
    try {
      const found = await getChatThread(threadID);
      if (found) setThread(found);
      else setError('スレッドが見つかりませんでした');
    } catch {
      setError('スレッドの取得に失敗しました');
    }
  }, [threadID]);

  const fetchMessages = useCallback(async () => {
    if (!threadID) return;
    try {
      const data = await listRoomMessages(threadID);
      setMessages(data.messages.items);
      setHasOlderMessages(data.messages.hasMoreBefore);
      setOldestMessageID(data.messages.items[0]?.ID ?? null);
    } catch {
      setMessagesError('メッセージ一覧の取得に失敗しました');
    }
  }, [threadID]);

  const loadOlderMessages = useCallback(async () => {
    if (!threadID || !oldestMessageID || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setLoadingOlderMessages(true);
    try {
      const data = await listRoomMessages(threadID, adminMessagePageSize, oldestMessageID);
      setMessages((prev) => [...data.messages.items, ...prev]);
      setHasOlderMessages(data.messages.hasMoreBefore);
      setOldestMessageID(data.messages.items[0]?.ID ?? oldestMessageID);
    } catch {
      setMessagesError('メッセージ一覧の取得に失敗しました');
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlderMessages(false);
    }
  }, [threadID, oldestMessageID]);

  useEffect(() => {
    if (!thread) void Promise.resolve().then(fetchThread);
  }, [thread, fetchThread]);

  useEffect(() => {
    void Promise.resolve().then(fetchMessages);
  }, [fetchMessages]);

  const handleDeleteMessage = async (message: Message) => {
    if (!window.confirm('このメッセージを削除しますか？')) return;
    try {
      await adminDeleteMessage(message.roomID, message.ID);
      setMessages((prev) => prev.filter((m) => m.ID !== message.ID));
    } catch {
      setError('メッセージの削除に失敗しました');
    }
  };

  if (!thread) return <p className={styles.loadingText}>{error || '読み込み中...'}</p>;

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>スレッド詳細</h1>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <button type="button" onClick={() => navigate(parentPath)} className={styles.backButton}>
          <ChevronLeft /> 戻る
        </button>

        <div className={styles.card}>
          <table className={styles.infoTable}>
            <tbody>
              <tr>
                <th>タイトル</th>
                <td>{thread.title}</td>
              </tr>
              <tr>
                <th>状態</th>
                <td>{thread.isClosed ? 'クローズ' : '公開中'}</td>
              </tr>
              <tr>
                <th>作成日時</th>
                <td>{new Date(thread.createdAt).toLocaleString('ja-JP')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeaderWithAction}>
            <h2 className={styles.cardTitle}>メッセージ</h2>
            {hasOlderMessages && (
              <button
                type="button"
                onClick={loadOlderMessages}
                disabled={loadingOlderMessages}
                className={styles.secondaryButton}
              >
                {loadingOlderMessages ? '読み込み中...' : '過去ログ読込'}
              </button>
            )}
          </div>

          {messagesError && <p className={styles.errorText}>{messagesError}</p>}
          {messages.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>投稿者</th>
                    <th>内容</th>
                    <th>日時</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message) => (
                    <tr key={message.ID}>
                      <td>
                        <div className={styles.userName}>{message.user.name}</div>
                        <span className={styles.subText}>@{message.user.accountID}</span>
                      </td>
                      <td className={styles.cellWrap}>
                        {message.stampID ? `スタンプ（${reactionLabel(message.stampID)}）` : message.content}
                        {message.media && message.media.length > 0 && (
                          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {message.media.map((m) =>
                              m.contentType.startsWith('image/') ? (
                                <a key={m.ID} href={storageUrl(m.url)} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={storageUrl(m.url)}
                                    alt="添付画像"
                                    className={styles.mediaThumb}
                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                  />
                                </a>
                              ) : (
                                <a key={m.ID} href={storageUrl(m.url)} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                                  {m.contentType.split('/')[1]?.toUpperCase() ?? 'FILE'}
                                </a>
                              ),
                            )}
                          </div>
                        )}
                      </td>
                      <td className={styles.dateCell}>{new Date(message.createdAt).toLocaleString('ja-JP')}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(message)}
                          className={styles.dangerButton}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !messagesError && <p className={styles.emptyText}>メッセージはありません</p>
          )}
        </div>
      </main>
    </div>
  );
};
