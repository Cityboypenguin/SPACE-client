import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

export const UserLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    try {
      const data = await loginUser(email, password);
      login(data.loginUser.token, data.loginUser.refreshToken, data.loginUser.user.ID);
      navigate('/mypage');
    } catch (e) {
      if (e instanceof Error && e.message.includes('account is frozen')) {
        setError('このアカウントは凍結されています。管理者にお問い合わせください。');
      } else {
        setError('メールアドレスまたはパスワードが正しくありません');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>ログイン</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
        required
      />
      <button type="submit">ログイン</button>
      <p>
        アカウントをお持ちでない方は<Link to="/register">新規登録</Link>
      </p>
    </form>
  );
};
