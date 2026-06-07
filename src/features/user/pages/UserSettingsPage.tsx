import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { getMyProfile, updateMyProfile } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { UserHeader } from '../components/organisms/UserHeader';
import { toUserMessage } from '../../../lib/errorMessages';

export const UserSettingsPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { mutate: globalMutate } = useSWRConfig();
  const [accountID, setAccountID] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = async () => {
    if (!window.confirm('キャッシュをクリアします。次回アクセス時に各データが再取得されます。よろしいですか？')) return;
    await globalMutate(() => true);
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  const { data: profile, isLoading } = useSWR(
    token ? 'my-profile' : null,
    () => getMyProfile().then((d) => d.me),
  );

  useEffect(() => {
    if (!profile) return;
    setAccountID(profile.accountID);
    setName(profile.name);
    setEmail(profile.email);
  }, [profile]);

  const handleUpdate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const input: Parameters<typeof updateMyProfile>[0] = { accountID, name, email };
      if (password) input.password = password;
      await updateMyProfile(input);
      setPassword('');
      setSuccess('更新しました');
    } catch (err) {
      setError(toUserMessage(err, 'アカウント情報の更新に失敗しました。時間をおいてから再度お試しください。'));
    }
  };

  if (isLoading) return <p>読み込み中...</p>;
  if (!profile) {
    if (!token) {
      navigate('/login');
      return null;
    }
    return <p style={{ color: 'red' }}>{error || 'プロフィールの取得に失敗しました。'}</p>;
  }

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

        <hr style={{ margin: '2rem 0', borderColor: '#e2e8f0' }} />
        <section>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>データキャッシュ</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
            アプリが保持している一時データをクリアします。動作がおかしいと感じたときにお試しください。
          </p>
          {cacheCleared && <p style={{ color: 'green', marginBottom: '0.5rem' }}>キャッシュをクリアしました</p>}
          <button
            type="button"
            onClick={handleClearCache}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: 6,
              border: '1px solid #94a3b8',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#475569',
            }}
          >
            キャッシュをクリア
          </button>
        </section>
      </main>
    </div>
  );
};
