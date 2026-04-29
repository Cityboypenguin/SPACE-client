import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export const UserRegisterPage = () => {
  const [userID, setUserID] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    try {
      await registerUser(userID, name, email, password);
      const loginData = await loginUser(email, password);
      login(loginData.loginUser.token, loginData.loginUser.refreshToken, loginData.loginUser.user.ID);
      navigate('/mypage');
    } catch {
      setError('登録に失敗しました。入力内容をご確認ください。');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>新規登録</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="text"
        value={userID}
        onChange={(e) => setUserID(e.target.value)}
        placeholder="ユーザーID"
        required
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="名前"
        required
      />
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
      <button type="submit">登録する</button>
      <p>
        すでにアカウントをお持ちの方は<Link to="/login">ログイン</Link>
      </p>
    </form>
  );
};
