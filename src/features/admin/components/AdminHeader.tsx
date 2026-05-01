import { useNavigate } from 'react-router-dom';
import { logoutAdmin, ADMIN_TOKEN_KEY, ADMIN_REFRESH_TOKEN_KEY } from '../api/auth';

export const AdminHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      try {
        await logoutAdmin(token);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    navigate('/admin/login');
  };

  return (
    <header>
      <h2>管理画面</h2>
      <button onClick ={() => navigate('/admin')}>ダッシュボード</button>
      <button onClick={() => navigate('/admin/users')}>ユーザー管理</button>
      <button onClick={() => navigate('/admin/administrators')}>管理者管理</button>
      <button onClick={() => navigate('/admin/register')}>新規管理者登録</button>
      <button onClick={handleLogout}>ログアウト</button>
    </header>
  );
};