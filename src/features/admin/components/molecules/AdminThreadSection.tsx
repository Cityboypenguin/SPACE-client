import { useCallback, useEffect, useRef, useState } from 'react';
import { listRoomMessages, adminDeleteMessage, adminMessagePageSize, type Message } from '../../api/communities';
import { listChatThreads, adminThreadPageSize, type AdminThread } from '../../api/threads';
import { reactionLabel } from '../../../user/constants/reactionStamps';
import { storageUrl } from '../../../../lib/storage';
import styles from '../../styles/AdminShared.module.css';

type Props = {
  // スレッドの親になる授業・コミュニティのルーム
  parentRoomID: string;
};

// 授業・コミュニティのスレッド一覧と、選んだスレッドのメッセージを表示する。
// スレッドは親とは別のルームなので、親のチャット履歴には中身が出ない。
export const AdminThreadSection = ({ parentRoomID }: Props) => {
  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [offset, setOffset] = useState(0);
  const [threadsError, setThreadsError] = useState('');

  const [selected, setSelected] = useState<AdminThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [oldestMessageID, setOldestMessageID] = useState<string | null>(null);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const loadingOlderRef = useRef(false);
  const [messagesError, setMessagesError] = useState('');

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

  const openThread = async (thread: AdminThread) => {
    setSelected(thread);
    setMessages([]);
    setMessagesError('');
    try {
      const data = await listRoomMessages(thread.roomID);
      setMessages(data.messages.items);
      setHasOlderMessages(data.messages.hasMoreBefore);
      setOldestMessageID(data.messages.items[0]?.ID ?? null);
    } catch {
      setMessagesError('スレッドのメッセージの取得に失敗しました');
    }
  };

  const loadOlderMessages = async () => {
    if (!selected || !oldestMessageID || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setLoadingOlderMessages(true);
    try {
      const data = await listRoomMessages(selected.roomID, adminMessagePageSize, oldestMessageID);
      setMessages((prev) => [...data.messages.items, ...prev]);
      setHasOlderMessages(data.messages.hasMoreBefore);
      setOldestMessageID(data.messages.items[0]?.ID ?? oldestMessageID);
    } catch {
      setMessagesError('スレッドのメッセージの取得に失敗しました');
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlderMessages(false);
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    if (!window.confirm('このメッセージを削除しますか？')) return;
    try {
      await adminDeleteMessage(message.roomID, message.ID);
      setMessages((prev) => prev.filter((m) => m.ID !== message.ID));
    } catch {
      setMessagesError('メッセージの削除に失敗しました');
    }
  };

  const closeThread = () => {
    setSelected(null);
    // 削除で件数が変わっているかもしれないので取り直す
    void fetchThreads();
  };

  if (selected) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeaderWithAction}>
          <h2 className={styles.cardTitle}>スレッド「{selected.title}」{selected.isClosed && '（クローズ済み）'}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {hasOlderMessages && (
              <button type="button" onClick={loadOlderMessages} disabled={loadingOlderMessages} className={styles.secondaryButton}>
                {loadingOlderMessages ? '読み込み中...' : '過去ログ読込'}
              </button>
            )}
            <button type="button" onClick={closeThread} className={styles.secondaryButton}>
              スレッド一覧に戻る
            </button>
          </div>
        </div>

        {messagesError && <p className={styles.errorText}>{messagesError}</p>}
        {messages.length > 0 ? (
          <div className={styles.courseChatTableWrapper}>
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
                          {message.media.map((m) => (
                            <a key={m.ID} href={storageUrl(m.url)} target="_blank" rel="noopener noreferrer">
                              {m.contentType.startsWith('image/') ? '添付画像' : m.contentType.split('/')[1]?.toUpperCase() ?? 'FILE'}
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className={styles.dateCell}>{new Date(message.createdAt).toLocaleString('ja-JP')}</td>
                    <td>
                      <button type="button" onClick={() => handleDeleteMessage(message)} className={styles.dangerButton}>
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
    );
  }

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
                    <button type="button" onClick={() => void openThread(thread)} className={styles.secondaryButton}>
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
