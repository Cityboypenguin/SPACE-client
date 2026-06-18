import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { UserListItem } from '../components/molecules/UserListItem';
import { listFavoriteUsers, createFavoriteUser, deleteFavoriteUser, type User } from '../api/favorite_user';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useToast } from '../../../context/ToastContext';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';

const LIMIT = 20;

export const FavoriteUsersPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(false);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [actionLoadingIds, setActionLoadingIds] = useState<Set<string>>(new Set());

  const loadUsers = useCallback(async (currentOffset: number, isInitial: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (isInitial) setInitialLoading(true);
    else setLoadingMore(true);
    try {
      const page = await listFavoriteUsers(LIMIT, currentOffset);
      setUsers((prev) => isInitial ? page.items : [...prev, ...page.items]);
      setTotal(page.total);
    } finally {
      loadingRef.current = false;
      if (isInitial) setInitialLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(0, true);
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

  const handleToggle = async (targetId: string, isRemoved: boolean) => {
    setActionLoadingIds((prev) => new Set(prev).add(targetId));
    try {
      if (isRemoved) {
        await createFavoriteUser(targetId);
        setRemovedIds((prev) => { const s = new Set(prev); s.delete(targetId); return s; });
      } else {
        await deleteFavoriteUser(targetId);
        setRemovedIds((prev) => new Set(prev).add(targetId));
      }
    } catch {
      addToast(isRemoved ? 'お気に入りの登録に失敗しました' : 'お気に入りの解除に失敗しました', 'error');
    } finally {
      setActionLoadingIds((prev) => { const s = new Set(prev); s.delete(targetId); return s; });
    }
  };

  return (
    <div>
      <UserSidebar />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
        <button onClick={() => navigate('/mypage')} style={{ marginBottom: '1rem' }}><ChevronLeft /> マイページに戻る</button>
        <h1>お気に入りリスト</h1>

        {initialLoading ? (
          <p>読み込み中...</p>
        ) : users.length === 0 ? (
          <p style={{ color: 'gray' }}>お気に入り登録しているユーザーはいません。</p>
        ) : (
          <>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {users.map((user) => {
                const isRemoved = removedIds.has(user.ID);
                return (
                  <UserListItem
                    key={user.ID}
                    user={user}
                    actionLabel={isRemoved ? 'お気に入り登録' : '解除'}
                    actionVariant={isRemoved ? 'default' : 'default'}
                    onAction={() => handleToggle(user.ID, isRemoved)}
                    disabled={actionLoadingIds.has(user.ID)}
                  />
                );
              })}
            </ul>
            <div ref={sentinelRef} style={{ height: '1px' }} />
            {loadingMore && <p style={{ textAlign: 'center', color: '#94a3b8' }}>読み込み中...</p>}
          </>
        )}
      </main>
    </div>
  );
};
