import { logoutAdmin } from '../api/auth';

export const AdminHeader = () => {
  const handleLogout = async () => {
    const token = localStorage.getItem('space_admin_token');
    if (token) {
      try {
        await logoutAdmin(token);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    // トークンを消してログイン画面へ
    localStorage.removeItem('space_admin_token');
    window.location.href = '/admin/login';
  };

  return (
    <header>
      <h2>管理画面</h2>
      <button onClick={handleLogout}>ログアウト</button>
    </header>
  );
};