import { useNavigate } from 'react-router-dom';
import { logoutAdmin } from '../api/auth';

export const AdminHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem('space_admin_token');
    if (token) {
      try {
        await logoutAdmin(token);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('space_admin_token');
    navigate('/admin/login');
  };

  return (
    <header>
      <h2>管理画面</h2>
      <button onClick={handleLogout}>ログアウト</button>
    </header>
  );
};