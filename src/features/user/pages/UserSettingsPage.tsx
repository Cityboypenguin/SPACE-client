import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSWRConfig } from 'swr';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile, deleteMyAccount } from '../api/profile';
import { getCurrentTerms } from '../api/terms';
import { listBlockedUsers, deleteBlocker, type User } from '../api/block';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { UserListItem } from '../components/molecules/UserListItem';
import { TermsContent } from '../components/molecules/TermsContent';
import { useToast } from '../../../context/ToastContext';
import { clearPostListCache, clearAllUserPostListCaches } from '../cache/postListCache';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from './UserSettingsPage.module.css';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { InquiryForm } from '../components/organisms/InquiryForm';

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
        <button className={styles.backBtn} onClick={onBack}><ChevronLeft /></button>
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

  useEffect(() => { loadUsers(0, true); }, [loadUsers]);

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
    if (!window.confirm('ブロックを解除しますか？')) return;
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
        <button className={styles.backBtn} onClick={onBack}><ChevronLeft /></button>
        ブロックリスト
      </h2>
      {initialLoading ? (
        <p style={{ color: '#94a3b8' }}>読み込み中...</p>
      ) : users.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>ブロックしているユーザーはいません。</p>
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
          {loadingMore && <p style={{ color: '#94a3b8', textAlign: 'center' }}>読み込み中...</p>}
        </>
      )}
    </>
  );
};

const TermsView = () => {
  const { data: terms } = useSWR('currentTerms', getCurrentTerms);

  if (!terms) return <p style={{ color: '#94a3b8' }}>読み込み中...</p>;

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
  const { mutate: globalMutate } = useSWRConfig();
  const [cacheCleared, setCacheCleared] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleClearCache = async () => {
    if (!window.confirm('キャッシュをクリアします。次回アクセス時に各データが再取得されます。よろしいですか？')) return;
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
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div
            style={{
              background: '#fff', borderRadius: 12, padding: '2rem',
              width: '90%', maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
              アカウントを削除しますか？
            </p>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
              この操作は取り消せません。投稿・メッセージなどすべてのデータが削除されます。
            </p>
            {deleteError && <p style={{ margin: '0 0 1rem', color: '#ef4444', fontSize: '0.85rem' }}>{deleteError}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
                disabled={deleting}
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: 8,
                  border: '1px solid #cbd5e1', background: '#fff',
                  cursor: 'pointer', fontWeight: 500, color: '#64748b',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={() => void handleDeleteAccount()}
                disabled={deleting}
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: 8,
                  border: 'none', background: '#ef4444',
                  cursor: deleting ? 'default' : 'pointer', fontWeight: 500, color: '#fff',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
        >
          <div
            style={{
              background: '#fff', borderRadius: 12, padding: '2rem',
              width: '90%', maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 500, color: '#1e293b' }}>
              ログアウトしますか？
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: 8,
                  border: '1px solid #cbd5e1', background: '#fff',
                  cursor: 'pointer', fontWeight: 500, color: '#64748b',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); void doLogout(); }}
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: 8,
                  border: 'none', background: '#ef4444',
                  cursor: 'pointer', fontWeight: 500, color: '#fff',
                }}
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
          <h1 className={styles.panelTitle}>設定</h1>
          <button
            className={`${styles.menuItem} ${view === 'general' || view === 'password' || view === 'blocks' ? styles.menuItemActive : ''}`}
            onClick={() => setView('general')}
          >
            一般
            <span className={styles.menuArrow}>›</span>
          </button>
          <button className={styles.menuItem} disabled style={{ color: '#cbd5e1', cursor: 'default' }}>
            通知設定
            <span className={styles.menuArrow}>›</span>
          </button>
          <button
            className={`${styles.menuItem} ${view === 'terms' ? styles.menuItemActive : ''}`}
            onClick={() => setView('terms')}
          >
            利用規約及びプライバシーポリシー
            <span className={styles.menuArrow}>›</span>
          </button>
          <button className={styles.menuItem} disabled style={{ color: '#cbd5e1', cursor: 'default' }}>
            運営からのアンケート
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
          {view === 'inquiry' && <InquiryForm />}
        </main>
      </div>
    </div>
  );
};
