import { useEffect, useState } from 'react';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { AdminPostCard } from '../components/organisms/AdminPostCard';
import { getPosts, adminDeletePost, type Post } from '../api/posts';
import { useToast } from '../../../context/ToastContext';

const PAGE_SIZE = 20;

export const AdminPostListPage = () => {
  const { addToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const loadPage = (p: number) => {
    setError('');
    getPosts(PAGE_SIZE, p * PAGE_SIZE)
      .then((data) => {
        setPosts(data.items);
        setTotal(data.total);
        setPage(p);
      })
      .catch(() => setError('投稿の読み込みに失敗しました'));
  };

  useEffect(() => {
    loadPage(0);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await adminDeletePost(id);
      setPosts((prev) => prev.filter((p) => p.ID !== id));
      setTotal((prev) => prev - 1);
      addToast('投稿を削除しました', 'success');
    } catch {
      addToast('削除に失敗しました', 'error');
    }
  };

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
            投稿管理
          </h1>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>全 {total} 件</span>
        </div>

        {error && <p style={{ color: 'red', padding: '1rem' }}>{error}</p>}

        {posts.length === 0 && !error ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>投稿がまだありません</p>
        ) : (
          posts.map((post) => (
            <AdminPostCard key={post.ID} post={post} onDelete={handleDelete} />
          ))
        )}

        {totalPages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={() => loadPage(page - 1)} disabled={page === 0}>前へ</button>
            <span>{page + 1} / {totalPages}</span>
            <button onClick={() => loadPage(page + 1)} disabled={page >= totalPages - 1}>次へ</button>
          </div>
        )}
      </main>
    </div>
  );
};
