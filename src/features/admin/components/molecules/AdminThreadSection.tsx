import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listChatThreads, deleteChatThread, adminThreadPageSize, type AdminThread } from '../../api/threads';
import threadStyles from '../../../user/components/organisms/ThreadWorkspace.module.css';
import styles from '../../styles/AdminShared.module.css';

type Props = {
  // スレッドの親になる授業・コミュニティのルーム
  parentRoomID: string;
  // 親の詳細ページのパス。スレッドは `${basePath}/threads/:threadID` で開く。
  basePath: string;
  // スレッドを消したあとに呼ぶ。親チャットの案内も消えるので、呼び出し側でチャット履歴を取り直す。
  onDeleted?: () => void;
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

// 授業・コミュニティのスレッド一覧。ユーザー側のスレッド一覧と同じ見た目で出す。
// スレッドは親とは別のルームなので、親のチャット履歴には中身が出ない。
export const AdminThreadSection = ({ parentRoomID, basePath, onDeleted }: Props) => {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<AdminThread[] | null>(null);
  const [offset, setOffset] = useState(0);
  const [threadsError, setThreadsError] = useState('');
  const [deletingID, setDeletingID] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    try {
      setThreads(await listChatThreads(parentRoomID, offset));
      setThreadsError('');
    } catch {
      setThreadsError('スレッド一覧の取得に失敗しました');
    }
  }, [parentRoomID, offset]);

  useEffect(() => {
    void Promise.resolve().then(fetchThreads);
  }, [fetchThreads]);

  const handleDelete = async (thread: AdminThread) => {
    if (!window.confirm(`スレッド「${thread.title}」を削除しますか？\n中のメッセージ（${thread.messageCount}件）もすべて削除され、元に戻せません。`)) return;
    setDeletingID(thread.roomID);
    try {
      await deleteChatThread(thread.roomID);
      await fetchThreads();
      onDeleted?.();
    } catch {
      setThreadsError('スレッドの削除に失敗しました');
    } finally {
      setDeletingID(null);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>スレッド</h2>
      {threadsError ? (
        <p className={styles.errorText}>{threadsError}</p>
      ) : !threads ? (
        <p className={threadStyles.description}>読み込み中…</p>
      ) : (
        <>
          {threads.length === 0 && (
            <div className={threadStyles.empty}>
              <strong>{offset > 0 ? 'これ以上のスレッドはありません' : 'スレッドはありません'}</strong>
            </div>
          )}
          <ul className={threadStyles.list}>
            {threads.map((thread) => (
              <li key={thread.roomID} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  className={threadStyles.listItem}
                  onClick={() => navigate(`${basePath}/threads/${encodeURIComponent(thread.roomID)}`, { state: { thread } })}
                >
                  <span className={threadStyles.listItemTop}>
                    <strong>{thread.title}</strong>
                    <span aria-hidden="true">›</span>
                  </span>
                  <span className={threadStyles.meta}>
                    {thread.messageCount}件のメッセージ
                    {thread.isClosed ? ' · クローズ済み' : ' · 公開中'}
                    {' · 作成 '}{formatDateTime(thread.createdAt)}
                    {thread.lastMessageAt && ` · 最終投稿 ${formatDateTime(thread.lastMessageAt)}`}
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => void handleDelete(thread)}
                  disabled={deletingID === thread.roomID}
                  style={{ flexShrink: 0 }}
                >
                  {deletingID === thread.roomID ? '削除中…' : '削除'}
                </button>
              </li>
            ))}
          </ul>
          {(offset > 0 || threads.length === adminThreadPageSize) && (
            <nav className={threadStyles.pagination} aria-label="スレッド一覧のページ">
              <button type="button" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - adminThreadPageSize))}>
                前へ
              </button>
              <button type="button" disabled={threads.length < adminThreadPageSize} onClick={() => setOffset((o) => o + adminThreadPageSize)}>
                次へ
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
};
