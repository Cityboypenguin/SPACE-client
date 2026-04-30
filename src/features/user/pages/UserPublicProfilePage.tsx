import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProfileByUserID, type Profile } from '../api/profile';
import { UserHeader } from '../components/UserHeader';

export const UserPublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getProfileByUserID(id)
      .then((data) => {
        if (data.getProfileByUserID) {
          setProfile(data.getProfileByUserID);
        } else {
          setError('プロフィールが見つかりませんでした');
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました';
        setError(message);
      });
  }, [id]);

  return (
    <div>
      <UserHeader />
      <main style={{ padding: '2rem' }}>
        <button onClick={() => navigate('/search')}>← 検索に戻る</button>
        <h1>ユーザー詳細</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!profile && !error && <p>読み込み中...</p>}
        {profile && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.user.name}
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', color: '#fff',
                }}>
                  {profile.user.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 style={{ margin: 0 }}>{profile.user.name}</h2>
                <p style={{ margin: 0, color: '#666' }}>@{profile.username}</p>
              </div>
            </div>

            <dl style={{ lineHeight: 2 }}>
              <dt style={{ fontWeight: 'bold' }}>自己紹介</dt>
              <dd>{profile.bio || '未設定'}</dd>
            </dl>
          </div>
        )}
      </main>
    </div>
  );
};
