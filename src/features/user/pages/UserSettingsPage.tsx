import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyProfile, updateMyProfile, type UserProfile } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { UserHeader } from '../components/UserHeader';

export const UserSettingsPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accountID, setAccountID] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    getMyProfile()
      .then((data) => {
        const p = data.me;
        setProfile(p);
        setAccountID(p.accountID);
        setName(p.name);
        setEmail(p.email);
      })
      .catch(() => setError('プロフィールの取得に失敗しました'));
  }, [token, navigate]);

  const handleUpdate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const input: Parameters<typeof updateMyProfile>[0] = { accountID, name, email };
      if (password) input.password = password;
      const data = await updateMyProfile(input);
      setProfile(data.updateUser);
      setPassword('');
      setSuccess('更新しました');
    } catch {
      setError('更新に失敗しました');
    }
  };

  if (!profile) return <p>読み込み中...</p>;

  return (
    <div>
      <UserHeader />
      <main style={{ padding: '2rem' }}>
        <Link to="/mypage">← マイページに戻る</Link>
        <h1>アカウント設定</h1>
        <p>登録日時: {profile.createdAt}</p>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <form onSubmit={handleUpdate}>
          <label>
            アカウントID
            <input
              type="text"
              value={accountID}
              onChange={(e) => setAccountID(e.target.value)}
              required
            />
          </label>
          <label>
            名前
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            メールアドレス
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            パスワード（変更する場合のみ入力）
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit">更新する</button>
        </form>
      </main>
    </div>
  );
};
