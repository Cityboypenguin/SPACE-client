import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyProfile, updateMyProfile, deleteMyAccount, type UserProfile } from '../api/profile';
import { USER_TOKEN_KEY, USER_ID_KEY } from '../api/auth';
import { UserHeader } from '../components/UserHeader';

export const UserSettingsPage = () => {
  const navigate = useNavigate();
  const id = localStorage.getItem(USER_ID_KEY);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userID, setUserID] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) {
      navigate('/login');
      return;
    }
    getMyProfile(id)
      .then((data) => {
        const p = data.getUserByID;
        setProfile(p);
        setUserID(p.userID);
        setName(p.name);
        setEmail(p.email);
      })
      .catch(() => setError('プロフィールの取得に失敗しました'));
  }, [id, navigate]);

  const handleUpdate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!id) return;
    setError('');
    setSuccess('');
    try {
      const input: Parameters<typeof updateMyProfile>[0] = { ID: id, userID, name, email };
      if (password) input.password = password;
      const data = await updateMyProfile(input);
      setProfile(data.updateUser);
      setPassword('');
      setSuccess('更新しました');
    } catch {
      setError('更新に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!id || !profile) return;
    if (!window.confirm('アカウントを削除しますか？この操作は取り消せません。')) return;
    try {
      await deleteMyAccount(id);
      localStorage.removeItem(USER_TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
      navigate('/login');
    } catch {
      setError('削除に失敗しました');
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
              onChange={(e) => setUserID(e.target.value)}
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

        <hr />
        <button onClick={handleDelete} style={{ color: 'red' }}>
          アカウントを削除する
        </button>
      </main>
    </div>
  );
};
