import { useNavigate } from 'react-router-dom';
import { logoutUser, USER_ID_KEY, USER_REFRESH_TOKEN_KEY, USER_TOKEN_KEY } from '../api/auth';

export const UserHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem(USER_TOKEN_KEY);
    if (token) {
      try {
        await logoutUser(token);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    window.location.href = '/login';
  };

  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', borderBottom: '1px solid #ccc' }}>
      <h2 style={{ margin: 0, cursor: 'pointer' }} onClick={() => navigate('/mypage')}>S-Universe</h2>
      <nav style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
        <button onClick={() => navigate('/mypage')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>ホーム</button>
        <button onClick={() => navigate('/search')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>ユーザー検索</button>
        <button onClick={() => navigate('/dm')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>DM</button>
      </nav>
      <button onClick={handleLogout}>ログアウト</button>
    </header>
  );
};
