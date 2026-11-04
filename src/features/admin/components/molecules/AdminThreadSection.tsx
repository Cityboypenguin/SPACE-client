import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listChatThreads, adminThreadPageSize, type AdminThread } from '../../api/threads';
import styles from '../../styles/AdminShared.module.css';

type Props = {
  // スレッドの親になる授業・コミュニティのルーム
  parentRoomID: string;
  // 親の詳細ページのパス。スレッドは `${basePath}/threads/:threadID` で開く。
  basePath: string;
};

// 授業・コミュニティのスレッド一覧。スレッドは親とは別のルームなので、親のチャット履歴には中身が出ない。
export const AdminThreadSection = ({ parentRoomID, basePath }: Props) => {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [offset, setOffset] = useState(0);
  const [threadsError, setThreadsError] = useState('');

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

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>スレッド</h2>
      {threadsError && <p className={styles.errorText}>{threadsError}</p>}
      {threads.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>タイトル</th>
                <th>状態</th>
                <th>件数</th>
                <th>最終投稿</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {threads.map((thread) => (
                <tr key={thread.roomID}>
                  <td className={styles.cellWrap}>{thread.title}</td>
                  <td>{thread.isClosed ? 'クローズ' : '公開中'}</td>
                  <td>{thread.messageCount}</td>
                  <td className={styles.dateCell}>
                    {new Date(thread.lastMessageAt ?? thread.createdAt).toLocaleString('ja-JP')}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => navigate(`${basePath}/threads/${encodeURIComponent(thread.roomID)}`, { state: { thread } })}
                      className={styles.secondaryButton}
                    >
                      開く
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !threadsError && <p className={styles.emptyText}>{offset > 0 ? 'これ以上のスレッドはありません' : 'スレッドはありません'}</p>
      )}
      {(offset > 0 || threads.length === adminThreadPageSize) && (
        <div className={styles.pagination}>
          <button
            type="button"
            onClick={() => setOffset((o) => Math.max(0, o - adminThreadPageSize))}
            disabled={offset === 0}
            className={styles.paginationButton}
          >
            前へ
          </button>
          <button
            type="button"
            onClick={() => setOffset((o) => o + adminThreadPageSize)}
            disabled={threads.length < adminThreadPageSize}
            className={styles.paginationButton}
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
};
