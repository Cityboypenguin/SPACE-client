import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getChatThread, deleteChatThread, type AdminThread } from '../api/threads';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { AdminChatView } from '../components/organisms/AdminChatView';
import threadStyles from '../../user/components/organisms/ThreadWorkspace.module.css';
import styles from '../styles/AdminShared.module.css';

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

// 授業チャット・コミュニティのスレッド1件を、ユーザー側のスレッド画面と同じ見た目で表示する。
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
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // 一覧から渡された内容は古いかもしれないので、件数などは開くたびに取り直す。
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

  useEffect(() => {
    void Promise.resolve().then(fetchThread);
  }, [fetchThread]);

  const handleDelete = async () => {
    if (!thread) return;
    if (!window.confirm(`スレッド「${thread.title}」を削除しますか？\n中のメッセージ（${thread.messageCount}件）もすべて削除され、元に戻せません。`)) return;
    setDeleting(true);
    try {
      await deleteChatThread(thread.roomID);
      navigate(parentPath, { replace: true });
    } catch {
      setError('スレッドの削除に失敗しました');
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <section className={threadStyles.panel} style={{ border: '1px solid var(--color-border)', borderRadius: '8px' }}>
          <header className={threadStyles.panelHeader}>
            <button
              type="button"
              className={threadStyles.iconButton}
              onClick={() => navigate(parentPath)}
              aria-label="親チャットに戻る"
              title="親チャットに戻る"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="m14 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className={threadStyles.headingBlock}>
              <span className={threadStyles.eyebrow}>スレッド</span>
              <h2>{thread?.title ?? (error || '読み込み中...')}</h2>
            </div>
            {thread && (
              <button type="button" className={styles.dangerButton} onClick={() => void handleDelete()} disabled={deleting}>
                {deleting ? '削除中…' : 'スレッドを削除'}
              </button>
            )}
          </header>

          {error && thread && <p className={threadStyles.error} role="alert">{error}</p>}

          {thread && (
            <p className={threadStyles.meta} style={{ padding: '8px 16px', margin: 0 }}>
              {thread.isClosed ? 'クローズ済み' : '公開中'}
              {' · '}{thread.messageCount}件のメッセージ
              {' · 作成 '}{formatDateTime(thread.createdAt)}
              {thread.lastMessageAt && ` · 最終投稿 ${formatDateTime(thread.lastMessageAt)}`}
            </p>
          )}
          {thread?.isClosed && <p className={threadStyles.notice}>このスレッドはクローズされています。</p>}

          {threadID && (
            <AdminChatView
              key={threadID}
              roomID={threadID}
              onOpenThread={(roomID) => navigate(`${parentPath}/threads/${encodeURIComponent(roomID)}`)}
            />
          )}
        </section>
      </main>
    </div>
  );
};
