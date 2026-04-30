import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyProfile, updateMyProfile, type UserProfile } from '../api/profile';
import { USER_TOKEN_KEY, USER_ID_KEY } from '../api/auth';
import { UserHeader } from '../components/UserHeader';

export const UserSettingsPage = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userID, setUserID] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem(USER_TOKEN_KEY);
    if (!token) {
      navigate('/login');
      return;
    }
    getMyProfile()
      .then((data) => {
        const p = data.me;
        setProfile(p);
        localStorage.setItem(USER_ID_KEY, p.accountID);
        setUserID(p.accountID);
        setName(p.name);
        setEmail(p.email);
      })
      .catch(() => setError('プロフィールの取得に失敗しました'));
  }, [navigate]);

  const handleUpdate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const input: Parameters<typeof updateMyProfile>[0] = { name, email };
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
          <h2>プロフィール編集</h2>
          <label>
            ユーザーID
            <input
              type="text"
              value={userID}
              readOnly
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
