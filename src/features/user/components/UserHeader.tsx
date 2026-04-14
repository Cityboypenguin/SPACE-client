import { logoutUser, USER_TOKEN_KEY } from '../api/auth';

export const UserHeader = () => {
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
    window.location.href = '/login';
  };

  return (
    <header>
      <h2>マイページ</h2>
      <button onClick={handleLogout}>ログアウト</button>
    </header>
  );
};
