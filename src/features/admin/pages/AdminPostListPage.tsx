import { useEffect, useState } from 'react';
import { getPosts, searchPosts, adminDeletePost, type Post } from '../api/posts';
import { AdminHeader } from '../components/AdminHeader';

export const AdminPostListPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const loadPosts = () => {
    getPosts()
      .then((data) => setPosts(data.posts))
      .catch(() => setError('投稿一覧の取得に失敗しました'));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!query.trim()) {
      loadPosts();
      return;
    }
    try {
      const data = await searchPosts(query);
      setPosts(data.searchPosts);
    } catch {
      setError('検索に失敗しました');
    }
  };

  const handleClear = () => {
    setQuery('');
    setError('');
    loadPosts();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('この投稿を削除しますか？')) return;
    try {
      await adminDeletePost(id);
      setPosts((prev) => prev.filter((p) => p.ID !== id));
    } catch {
      setError('削除に失敗しました');
    }
  };

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <h1>投稿一覧</h1>
        <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="内容で検索"
          />
          <button type="submit">検索</button>
          {query && (
            <button type="button" onClick={handleClear} style={{ marginLeft: '0.5rem' }}>
              クリア
            </button>
          )}
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <table>
          <thead>
            <tr>
              <th>内容</th>
              <th>投稿者</th>
              <th>投稿日時</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.ID}>
                <td
                  style={{
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {post.content}
                </td>
                <td>
                  {post.user.name} (@{post.user.accountID})
                </td>
                <td>{post.createdAt}</td>
                <td>
                  <button onClick={() => handleDelete(post.ID)} style={{ color: 'red' }}>
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && !error && <p>投稿が見つかりませんでした</p>}
      </main>
    </div>
  );
};
