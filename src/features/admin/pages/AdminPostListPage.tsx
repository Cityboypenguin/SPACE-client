import useSWR from 'swr';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { AdminPostCard } from '../components/organisms/AdminPostCard';
import { getPosts, adminDeletePost, type Post } from '../api/posts';
import { useToast } from '../../../context/ToastContext';

export const AdminPostListPage = () => {
  const { addToast } = useToast();

  const { data: posts, error, isLoading, mutate } = useSWR<Post[]>('admin-posts', getPosts);

  const handleDelete = async (id: string) => {
    try {
      await adminDeletePost(id);

      mutate(posts?.filter(p => p.ID !== id), { revalidate: false });

      addToast('投稿を削除しました', 'success');
    } catch (err) {
      console.error('Failed to delete post:', err);
      addToast('削除に失敗しました', 'error');
    }
  };

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
            投稿管理
          </h1>
        </div>

        {error && <p style={{ color: 'red', padding: '1rem' }}>投稿の読み込みに失敗しました</p>}

        {isLoading ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <AdminPostCard
              key={post.ID}
              post={post}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>投稿がまだありません</p>
        )}
      </main>
    </div>
  );
};