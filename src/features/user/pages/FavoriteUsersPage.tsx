import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { listFavoriteUsers, deleteFavoriteUser, type User } from '../api/favorite_user';
import { storageUrl } from '../../../lib/storage';
import { useToast } from '../../../context/ToastContext';

const LIMIT = 20;

export const FavoriteUsersPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadUsers = useCallback(async (currentOffset: number, isInitial: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (isInitial) setInitialLoading(true);
    else setLoadingMore(true);
    try {
      const page = await listFavoriteUsers(LIMIT, currentOffset);
      setUsers((prev) => isInitial ? page.items : [...prev, ...page.items]);
      setTotal(page.total);
      setOffset(currentOffset + page.items.length);
    } finally {
      loadingRef.current = false;
      if (isInitial) setInitialLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(0, true);
  }, [loadUsers]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setOffset((prev) => {
            if (!loadingRef.current && prev < total) {
              loadUsers(prev, false);
            }
            return prev;
          });
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [total, loadUsers]);

  const handleUnfavorite = async (targetId: string) => {
    if (!window.confirm('お気に入りを解除しますか？')) return;
    try {
      await deleteFavoriteUser(targetId);
      setUsers((prev) => prev.filter((u) => u.ID !== targetId));
      setTotal((prev) => prev - 1);
    } catch {
      addToast('お気に入りの解除に失敗しました', 'error');
    }
  };

  return (
    <div>
      <UserHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
        <button onClick={() => navigate('/mypage')} style={{ marginBottom: '1rem' }}>← マイページに戻る</button>
        <h1>お気に入り一覧</h1>

        {initialLoading ? (
          <p>読み込み中...</p>
        ) : users.length === 0 ? (
          <p style={{ color: 'gray' }}>お気に入り登録しているユーザーはいません。</p>
        ) : (
          <>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {users.map((user) => (
                <li key={user.ID} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                  <div onClick={() => navigate(`/users/${user.ID}`)} style={{ cursor: 'pointer', marginRight: '16px' }}>
                    {user.avatarUrl ? (
                      <img src={storageUrl(user.avatarUrl) ?? undefined} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{user.name.charAt(0)}</div>
                    )}
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{user.name}</p>
                    <p style={{ margin: 0, fontSize: '0.8em', color: 'gray' }}>@{user.accountID}</p>
                  </div>
                  <button onClick={() => handleUnfavorite(user.ID)} style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}>
                    解除
                  </button>
                </li>
              ))}
            </ul>
            <div ref={sentinelRef} style={{ height: '1px' }} />
            {loadingMore && <p style={{ textAlign: 'center', color: '#94a3b8' }}>読み込み中...</p>}
          </>
        )}
      </main>
    </div>
  );
};
