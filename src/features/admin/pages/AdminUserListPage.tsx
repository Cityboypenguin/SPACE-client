import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, searchUsers, adminCreateUser, type User } from '../api/users';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';

const DUMMY_FORM_INIT = { accountID: '', name: '', email: '', password: '' };

export const AdminUserListPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('users');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(DUMMY_FORM_INIT);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / pageSize);

  const loadPage = (p: number, size = pageSize) => {
    setError('');
    getUsers(size, p * size)
      .then((data) => {
        setUsers(data.users.items);
        setTotal(data.users.total);
        setPage(p);
      })
      .catch(() => setError('ユーザー一覧の取得に失敗しました'));
  };

  useEffect(() => {
    if (!isSearching) loadPage(0);
  }, [pageSize]);

  const handleSearch = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    if (!query.trim()) {
      setIsSearching(false);
      loadPage(0);
      return;
    }
    try {
      const data = await searchUsers(query);
      setUsers(data.searchUsers.items);
      setTotal(data.searchUsers.total);
      setIsSearching(true);
    } catch {
      setError('検索に失敗しました');
    }
  };

  const handleClear = () => {
    setQuery('');
    setError('');
    setIsSearching(false);
    loadPage(0);
  };

  const handleCreateDummy = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await adminCreateUser(form);
      setShowModal(false);
      setForm(DUMMY_FORM_INIT);
      loadPage(0);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'アカウント作成に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0 }}>ユーザー一覧</h1>
          <button onClick={() => { setShowModal(true); setCreateError(''); setForm(DUMMY_FORM_INIT); }}>
            ダミーアカウント作成
          </button>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: '2rem', minWidth: 360 }}>
              <h2 style={{ marginTop: 0 }}>ダミーアカウント作成</h2>
              <form onSubmit={handleCreateDummy}>
                {(['accountID', 'name', 'email', 'password'] as const).map((field) => (
                  <div key={field} style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>{field}</label>
                    <input
                      type={field === 'password' ? 'password' : 'text'}
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      required
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                {createError && <p style={{ color: 'red', fontSize: '0.85rem' }}>{createError}</p>}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} disabled={creating}>キャンセル</button>
                  <button type="submit" disabled={creating}>{creating ? '作成中...' : '作成'}</button>
                </div>
              </form>
            </div>
          </div>
        )}


        <form onSubmit={handleSearch} style={{ marginBottom: '1rem', marginTop: 0 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前で検索"
          />
          <button type="submit">検索</button>
          {query && (
            <button type="button" onClick={handleClear} style={{ marginLeft: '0.5rem' }}>
              クリア
            </button>
          )}
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>全 {total} 件</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
            表示件数
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '0.25rem 0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}件</option>)}
            </select>
          </label>
        </div>
        <table>
          <thead>
            <tr>
              <th>ユーザーID</th>
              <th>名前</th>
              <th>メールアドレス</th>
              <th>ロール</th>
              <th>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.ID}
                onClick={() => navigate(`/admin/users/${user.ID}`)}
                style={{ cursor: 'pointer' }}
              >
                <td>{user.accountID}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !error && <p>該当するユーザーが見つかりませんでした</p>}
        {!isSearching && totalPages > 1 && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => loadPage(page - 1)} disabled={page === 0}>前へ</button>
            <span>{page + 1} / {totalPages}</span>
            <button onClick={() => loadPage(page + 1)} disabled={page >= totalPages - 1}>次へ</button>
          </div>
        )}
      </main>
    </div>
  );
};
