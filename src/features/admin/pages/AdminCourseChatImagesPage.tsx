import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { CourseChatAdminTabs } from '../components/molecules/CourseChatAdminTabs';
import { AdminPagination } from '../components/molecules/AdminPagination';
import {
  deleteCourseChatImage,
  listCourseChatImages,
  listRemovedCourseChatImages,
  restoreCourseChatImage,
  type CourseChatImage,
  type RemovedCourseChatImage,
  type CourseChatImageSource,
} from '../api/courseChatImages';
import { toUserMessage } from '../../../lib/errorMessages';
import { storageUrl } from '../../../lib/storage';
import styles from '../styles/AdminShared.module.css';
import courseStyles from '../styles/CourseChatAdmin.module.css';

const PAGE_SIZE = 24;

const sourceLabel: Record<CourseChatImageSource, string> = {
  MESSAGE: 'チャット',
  QUESTION: '質問',
  ANSWER: '回答',
};

type Tab = CourseChatImageSource | 'ALL' | 'REMOVED';

const TABS: { key: Tab; label: string }[] = [
  { key: 'ALL', label: 'すべて' },
  { key: 'MESSAGE', label: 'チャット' },
  { key: 'QUESTION', label: '質問' },
  { key: 'ANSWER', label: '回答' },
  { key: 'REMOVED', label: '削除済み' },
];

const formatDateTime = (s: string) => new Date(s).toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// 授業内チャットに上がった画像（メッセージ・質問・回答）を、まとめて見て消す画面（ADM-05）。
// 授業資料の共有を防ぐための取り締まり用。削除すると利用者からは見えなくなり、通報のない画像は
// 30日後に完全に消える。それまでは「削除済み」から元に戻せる。
export const AdminCourseChatImagesPage = () => {
  const [tab, setTab] = useState<Tab>('ALL');
  const [page, setPage] = useState(0);
  // 授業での絞り込み（カードの授業名を押すと、その授業だけにする）。
  const [room, setRoom] = useState<{ id: string; name: string } | null>(null);
  const [items, setItems] = useState<CourseChatImage[]>([]);
  const [removedItems, setRemovedItems] = useState<RemovedCourseChatImage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyID, setBusyID] = useState<string | null>(null);

  // 切り替えの途中で遅れて届いた古い応答が、いまの絞り込みの結果を上書きしないための番号。
  const requestSeq = useRef(0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const roomID = room?.id;
  const load = useCallback(async (nextTab: Tab, nextPage: number, nextRoomID: string | undefined) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      if (nextTab === 'REMOVED') {
        const data = await listRemovedCourseChatImages(nextRoomID, PAGE_SIZE, nextPage * PAGE_SIZE);
        if (seq !== requestSeq.current) return;
        setRemovedItems(data.items);
        setTotal(data.total);
        setError('');
        return;
      }
      const data = await listCourseChatImages(nextRoomID, nextTab === 'ALL' ? undefined : nextTab, PAGE_SIZE, nextPage * PAGE_SIZE);
      if (seq !== requestSeq.current) return;
      setItems(data.items);
      setTotal(data.total);
      setError('');
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setError(toUserMessage(err, '画像の一覧を取得できませんでした'));
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => load(tab, page, roomID));
  }, [load, tab, page, roomID]);

  const handleDelete = async (img: CourseChatImage) => {
    if (!window.confirm(`この画像を削除しますか？\n\n授業: ${img.courseName}\n投稿者: ${img.uploaderName}（@${img.uploaderAccountID}）\n\n利用者からは見えなくなります。通報のない画像は30日後に完全に消え、それまでは「削除済み」から元に戻せます。`)) return;
    setBusyID(img.ID);
    setError('');
    try {
      await deleteCourseChatImage(img.ID);
      // 最後の1枚を消して空のページが残らないよう、必要なら1つ前のページへ戻る。
      const remaining = total - 1;
      const lastPage = Math.max(0, Math.ceil(remaining / PAGE_SIZE) - 1);
      if (page > lastPage) setPage(lastPage);
      else await load(tab, page, roomID);
    } catch (err) {
      setError(toUserMessage(err, '画像を削除できませんでした'));
    } finally {
      setBusyID(null);
    }
  };

  const handleRestore = async (img: RemovedCourseChatImage) => {
    if (!window.confirm(`この画像を元に戻しますか？\n\n授業: ${img.courseName}\n投稿者: ${img.uploaderName}\n\n利用者からまた見えるようになります。`)) return;
    setBusyID(img.ID);
    setError('');
    try {
      await restoreCourseChatImage(img.ID);
      const remaining = total - 1;
      const lastPage = Math.max(0, Math.ceil(remaining / PAGE_SIZE) - 1);
      if (page > lastPage) setPage(lastPage);
      else await load(tab, page, roomID);
    } catch (err) {
      setError(toUserMessage(err, '画像を元に戻せませんでした'));
    } finally {
      setBusyID(null);
    }
  };

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>授業内チャット管理</h1>
        </div>
        <CourseChatAdminTabs />
        <p className={`${styles.cellMuted} ${courseStyles.intro}`}>
          授業内チャットのチャット・質問・回答に上がった画像を、新しい順にまとめて表示します。授業資料の共有などを見つけたら削除してください。削除すると利用者からは見えなくなり、通報のない画像は30日後に完全に消えます。それまでは「削除済み」から元に戻せます。
        </p>

        <div className={courseStyles.toolbar}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={tab === t.key ? styles.primaryButton : styles.paginationButton}
              onClick={() => { setTab(t.key); setPage(0); }}
            >
              {t.label}
            </button>
          ))}
          <span className={`${styles.countText} ${courseStyles.count}`}>全 {total} 枚</span>
        </div>
        {room && (
          <p className={courseStyles.roomFilter}>
            授業「{room.name}」だけを表示中
            <button type="button" className={`${styles.paginationButton} ${courseStyles.clearFilter}`} onClick={() => { setRoom(null); setPage(0); }}>
              絞り込みを解除
            </button>
          </p>
        )}

        {error && <p className={styles.formError}>{error}</p>}
        {loading && (tab === 'REMOVED' ? removedItems : items).length === 0 && <p className={styles.cellMuted}>読み込み中...</p>}
        {!loading && !error && (tab === 'REMOVED' ? removedItems : items).length === 0 && <p className={styles.cellMuted}>画像はありません。</p>}

        <div className={courseStyles.imageGrid}>
          {tab === 'REMOVED' && removedItems.map((img) => (
            <div key={img.ID} className={`${styles.card} ${courseStyles.imageCard}`}>
              <a href={storageUrl(img.url)} target="_blank" rel="noopener noreferrer" className={courseStyles.imageLink}>
                <img src={storageUrl(img.url)} alt="" loading="lazy" className={courseStyles.image} />
              </a>
              <div className={courseStyles.imageMeta}>
                <div><strong>{sourceLabel[img.source]}</strong></div>
                <div>
                  <button
                    type="button"
                    title="この授業の画像だけを表示"
                    onClick={() => { setRoom({ id: img.roomID, name: img.courseName }); setPage(0); }}
                    className={courseStyles.roomLink}
                  >
                    {img.courseName}
                  </button>
                </div>
                <div>
                  <Link to={`/admin/users/${img.uploaderID}`}>{img.uploaderName}</Link>
                  {img.uploaderAccountID && <span className={styles.cellMuted}> @{img.uploaderAccountID}</span>}
                </div>
                <div className={styles.cellMuted}>削除: {formatDateTime(img.removedAt)}</div>
                <div className={img.reported ? styles.errorText : styles.cellMuted}>
                  {img.reported || !img.expiresAt ? '通報があるため保持中' : `完全に消える日時: ${formatDateTime(img.expiresAt)}`}
                </div>
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={busyID === img.ID}
                onClick={() => void handleRestore(img)}
              >
                {busyID === img.ID ? '処理中...' : '元に戻す'}
              </button>
            </div>
          ))}
          {tab !== 'REMOVED' && items.map((img) => (
            <div key={img.ID} className={`${styles.card} ${courseStyles.imageCard}`}>
              <a href={storageUrl(img.url)} target="_blank" rel="noopener noreferrer" className={courseStyles.imageLink}>
                <img
                  src={storageUrl(img.url)}
                  alt=""
                  loading="lazy"
                  className={courseStyles.image}
                />
              </a>
              <div className={courseStyles.imageMeta}>
                <div><strong>{sourceLabel[img.source]}</strong>{img.targetDeleted && <span className={styles.errorText}>（投稿は削除済み）</span>}</div>
                <div>
                  <button
                    type="button"
                    title="この授業の画像だけを表示"
                    onClick={() => { setRoom({ id: img.roomID, name: img.courseName }); setPage(0); }}
                    className={courseStyles.roomLink}
                  >
                    {img.courseName}
                  </button>
                </div>
                <div>
                  <Link to={`/admin/users/${img.uploaderID}`}>{img.uploaderName}</Link>
                  <span className={styles.cellMuted}> @{img.uploaderAccountID}</span>
                </div>
                <div className={styles.cellMuted}>{formatDateTime(img.createdAt)}</div>
              </div>
              <button
                type="button"
                className={styles.dangerButton}
                disabled={busyID === img.ID}
                onClick={() => void handleDelete(img)}
              >
                {busyID === img.ID ? '削除中...' : '削除'}
              </button>
            </div>
          ))}
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        />
      </main>
    </div>
  );
};
