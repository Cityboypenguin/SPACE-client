import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSWRConfig } from 'swr';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { useAuth } from '../context/useAuth';
import { updateMyProfile, deleteMyAccount } from '../api/profile';
import { getCurrentTerms } from '../api/terms';
import { listBlockedUsers, deleteBlocker, type User } from '../api/block';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { UserListItem } from '../../../components/molecules/UserListItem';
import { TermsContent } from '../components/molecules/TermsContent';
import { useToast } from '../../../context/useToast';
import { useTheme } from '../../../context/useTheme';
import { getTimetableProfileVisibility, setTimetableProfileVisibility } from '../api/timetableVisibility';
import { clearPostListCache, clearAllUserPostListCaches } from '../cache/postListCache';
import { staticCacheOptions } from '../cache/swrOptions';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from './UserSettingsPage.module.css';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { InquiryForm } from '../components/organisms/InquiryForm';
import { AppSwal } from '../../../lib/swal';

type View = 'general' | 'password' | 'blocks' | 'terms' | 'inquiry' | null;

const LIMIT = 20;

const PasswordView = ({ onBack }: { onBack: () => void }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { setError('現在のパスワードを入力してください'); return; }
    if (newPassword.length < 8) { setError('新しいパスワードは8文字以上で入力してください'); return; }
    if (newPassword !== confirmPassword) { setError('新しいパスワードが一致しません'); return; }
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await updateMyProfile({ password: newPassword, currentPassword });
      setSuccess('パスワードを変更しました');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(toUserMessage(err, 'パスワードの変更に失敗しました'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h2 className={styles.backTitle}>
        <button onClick={onBack}><ChevronLeft /></button>
        パスワード変更
      </h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.fieldLabel}>
          現在のパスワード
          <input
            type="password"
            className={styles.input}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="パスワードを入力してください"
          />
        </label>
        <label className={styles.fieldLabel}>
          新しいパスワード
          <input
            type="password"
            className={styles.input}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="パスワードを入力してください"
          />
        </label>
        <label className={styles.fieldLabel}>
          新しいパスワードを再度入力してください
          <input
            type="password"
            className={styles.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="パスワードを入力してください"
          />
        </label>
        {error && <p className={styles.errorMsg}>{error}</p>}
        {success && <p className={styles.successMsg}>{success}</p>}
        <button type="submit" className={styles.submitBtn} disabled={submitting}>
          {submitting ? '変更中...' : 'パスワードを変更する'}
        </button>
      </form>
    </>
  );
};

const BlocksView = ({ onBack }: { onBack: () => void }) => {
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(false);

  const loadUsers = useCallback(async (currentOffset: number, isInitial: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (isInitial) setInitialLoading(true);
    else setLoadingMore(true);
    try {
      const page = await listBlockedUsers(LIMIT, currentOffset);
      setUsers((prev) => isInitial ? page.items : [...prev, ...page.items]);
      setTotal(page.total);
    } finally {
      loadingRef.current = false;
      if (isInitial) setInitialLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadUsers(0, true));
  }, [loadUsers]);

  const sentinelRef = useInfiniteScroll(
    useCallback(() => {
      setUsers((prev) => {
        if (!loadingRef.current && prev.length < total) loadUsers(prev.length, false);
        return prev;
      });
    }, [total, loadUsers]),
    loadingMore,
  );

  const handleUnblock = async (targetId: string) => {
    const result = await AppSwal.fire({
      text: 'ブロックを解除しますか？',
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deleteBlocker(targetId);
      setUsers((prev) => prev.filter((u) => u.ID !== targetId));
      setTotal((prev) => prev - 1);
    } catch {
      addToast('ブロックの解除に失敗しました', 'error');
    }
  };

  return (
    <>
      <h2 className={styles.backTitle}>
        <button onClick={onBack}><ChevronLeft /></button>
        ブロックリスト
      </h2>
      {initialLoading ? (
        <p className={styles.mutedText}>読み込み中...</p>
      ) : users.length === 0 ? (
        <p className={styles.mutedText}>ブロックしているユーザーはいません。</p>
      ) : (
        <>
          <ul className={styles.blockList}>
            {users.map((user) => (
              <UserListItem
                key={user.ID}
                user={user}
                actionLabel="ブロック解除"
                onAction={() => handleUnblock(user.ID)}
                actionVariant="danger"
              />
            ))}
          </ul>
          <div ref={sentinelRef} style={{ height: 1 }} />
          {loadingMore && <p className={styles.mutedTextCenter}>読み込み中...</p>}
        </>
      )}
    </>
  );
};

const TermsView = () => {
  const { data: terms } = useSWR('currentTerms', getCurrentTerms, staticCacheOptions);

  if (!terms) return <p className={styles.mutedText}>読み込み中...</p>;

  return (
    <div className={styles.termsWrap}>
      <h2 className={styles.sectionTitle}>利用規約及びプライバシーポリシー</h2>
      <TermsContent documentUrl={terms.documentUrl} />
    </div>
  );
};

const GeneralView = ({
  onPasswordClick,
  onBlocksClick,
}: {
  onPasswordClick: () => void;
  onBlocksClick: () => void;
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const { mutate: globalMutate } = useSWRConfig();
  const [cacheCleared, setCacheCleared] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [timetableVisible, setTimetableVisible] = useState(true);

  useEffect(() => {
    getTimetableProfileVisibility()
      .then(setTimetableVisible)
      .catch(() => {});
  }, []);

  const handleTimetableVisibilityChange = async (visible: boolean) => {
    const previous = timetableVisible;
    setTimetableVisible(visible);
    try {
      await setTimetableProfileVisibility(visible);
    } catch {
      setTimetableVisible(previous);
      addToast('設定の変更に失敗しました', 'error');
    }
  };

  const handleClearCache = async () => {
    const result = await AppSwal.fire({
      text: 'キャッシュをクリアします。次回アクセス時に各データが再取得されます。よろしいですか？',
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    await globalMutate(() => true);
    clearPostListCache();
    clearAllUserPostListCaches();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  const doLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteMyAccount();
      await logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'アカウントの削除に失敗しました');
      setDeleting(false);
    }
  };

  return (
    <>
      <h2 className={styles.sectionTitle}>一般設定</h2>
      <div className={styles.subMenuList}>
        <button className={styles.subMenuItem} onClick={onPasswordClick}>
          パスワード変更
          <span className={styles.subMenuArrow}>›</span>
        </button>
        <button className={styles.subMenuItem} onClick={onBlocksClick}>
          ブロックリスト
          <span className={styles.subMenuArrow}>›</span>
        </button>
      </div>

      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>ダークモード</span>
        <input
          type="checkbox"
          role="switch"
          className={styles.switch}
          checked={theme === 'dark'}
          onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
        />
      </div>

      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>プロフィールに時間割を公開する</span>
        <input
          type="checkbox"
          role="switch"
          className={styles.switch}
          checked={timetableVisible}
          onChange={(e) => void handleTimetableVisibilityChange(e.target.checked)}
        />
      </div>

      <div className={styles.actionGroup}>
        {cacheCleared && <p className={styles.successMsg}>キャッシュをクリアしました</p>}
        <button type="button" className={styles.actionBtn} onClick={handleClearCache}>
          キャッシュの削除
        </button>
        <button type="button" className={`${styles.actionBtn} ${styles.logoutBtn}`} onClick={() => setShowLogoutConfirm(true)}>
          ログアウト
        </button>
        <button type="button" className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => setShowDeleteConfirm(true)}>
          アカウント削除
        </button>
      </div>

      {showDeleteConfirm && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div className={styles.modalCard}>
            <p className={styles.modalTitle}>
              アカウントを削除しますか？
            </p>
            <p className={styles.modalBody}>
              この操作は取り消せません。投稿・メッセージなどすべてのデータが削除されます。
            </p>
            {deleteError && <p className={styles.errorMsg} style={{ marginBottom: '1rem' }}>{deleteError}</p>}
            <div className={styles.modalActions}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
                disabled={deleting}
                className={styles.modalCancelBtn}
              >
                キャンセル
              </button>
              <button
                onClick={() => void handleDeleteAccount()}
                disabled={deleting}
                className={styles.modalDangerBtn}
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
        >
          <div className={styles.modalCard}>
            <p className={styles.modalTitle}>
              ログアウトしますか？
            </p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowLogoutConfirm(false)} className={styles.modalCancelBtn}>
                キャンセル
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); void doLogout(); }}
                className={styles.modalDangerBtn}
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const UserSettingsPage = () => {
  const [view, setView] = useState<View>(null);

  return (
    <div>
      <UserSidebar />
      <div className={styles.page}>
        {/* 左パネル */}
        <aside className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <h1 className={styles.panelTitle}>設定</h1>
          </div>
          <button
            className={`${styles.menuItem} ${view === 'general' || view === 'password' || view === 'blocks' ? styles.menuItemActive : ''}`}
            onClick={() => setView('general')}
          >
            一般
            <span className={styles.menuArrow}>›</span>
          </button>
          <button
            className={`${styles.menuItem} ${view === 'terms' ? styles.menuItemActive : ''}`}
            onClick={() => setView('terms')}
          >
            利用規約及びプライバシーポリシー
            <span className={styles.menuArrow}>›</span>
          </button>
          <button
            className={`${styles.menuItem} ${view === 'inquiry' ? styles.menuItemActive : ''}`}
            onClick={() => setView('inquiry')}
          >
            お問い合わせ
            <span className={styles.menuArrow}>›</span>
          </button>
        </aside>

        {/* 右パネル */}
        <main className={styles.rightPanel}>
          {view === 'general' && (
            <GeneralView
              onPasswordClick={() => setView('password')}
              onBlocksClick={() => setView('blocks')}
            />
          )}
          {view === 'password' && <PasswordView onBack={() => setView('general')} />}
          {view === 'blocks' && <BlocksView onBack={() => setView('general')} />}
          {view === 'terms' && <TermsView />}
          {view === 'inquiry' && <InquiryForm onComplete={() => setView(null)} />}
        </main>
      </div>
    </div>
  );
};
