import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { UserListItem } from '../components/molecules/UserListItem';
import { listBlockedUsers, deleteBlocker, type User } from '../api/block';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useToast } from '../../../context/ToastContext';
import { useRef } from 'react';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import swal from 'sweetalert2';

const LIMIT = 20;

export const BlockedUsersPage = () => {
  const navigate = useNavigate();
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

  const handleUnblock = async (targetId: string) => {
    const result = await swal.fire({
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
    <div>
      <UserSidebar />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
        <button onClick={() => navigate('/mypage')} style={{ marginBottom: '1rem' }}><ChevronLeft /> マイページに戻る</button>
        <h1>ブロック一覧</h1>

        {initialLoading ? (
          <p>読み込み中...</p>
        ) : users.length === 0 ? (
          <p style={{ color: 'gray' }}>ブロックしているユーザーはいません。</p>
        ) : (
          <>
            <ul style={{ listStyle: 'none', padding: 0 }}>
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
            <div ref={sentinelRef} style={{ height: '1px' }} />
            {loadingMore && <p style={{ textAlign: 'center', color: '#94a3b8' }}>読み込み中...</p>}
          </>
        )}
      </main>
    </div>
  );
};
