import { useCallback, useEffect, useState } from 'react';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { AdminPostCard } from '../components/organisms/AdminPostCard';
import { getPosts, adminDeletePost, type Post } from '../api/posts';
import { useToast } from '../../../context/useToast';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import { AdminPageSizeSelect } from '../components/molecules/AdminPageSizeSelect';
import { AdminPagination } from '../components/molecules/AdminPagination';
import styles from '../styles/AdminShared.module.css';


export const AdminPostListPage = () => {
  const { addToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('posts');
  const [error, setError] = useState('');

  const totalPages = Math.ceil(total / pageSize);

  const loadPage = useCallback((p: number, size = pageSize) => {
    setError('');
    getPosts(size, p * size)
      .then((data) => {
        setPosts(data.items);
        setTotal(data.total);
        setPage(p);
      })
      .catch(() => setError('投稿の読み込みに失敗しました'));
  }, [pageSize]);

  useEffect(() => {
    void Promise.resolve().then(() => loadPage(0));
  }, [loadPage]);

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
      <main className={styles.feedPage}>
        <div className={styles.feedHeader}>
          <h1 className={styles.titleSmall}>
            投稿管理
          </h1>
          <div className={styles.toolbarGroup}>
            <span className={styles.countText}>全 {total} 件</span>
            <AdminPageSizeSelect value={pageSize} onChange={setPageSize} />
          </div>
        </div>

        {error && <p className={styles.errorPadded}>{error}</p>}

        {posts.length === 0 && !error ? (
          <p className={styles.emptyState}>投稿がまだありません</p>
        ) : (
          posts.map((post) => (
            <AdminPostCard key={post.ID} post={post} onDelete={handleDelete} />
          ))
        )}

        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPrev={() => loadPage(page - 1)}
          onNext={() => loadPage(page + 1)}
        />
      </main>
    </div>
  );
};
