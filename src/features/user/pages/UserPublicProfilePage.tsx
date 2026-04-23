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
          <dl>
            <dt>ユーザーID</dt>
            <dd>{profile.userID}</dd>
            <dt>名前</dt>
            <dd>{profile.user.name}</dd>
            <dt>ユーザー名</dt>
            <dd>{profile.username}</dd>
            <dt>自己紹介</dt>
            <dd>{profile.bio ?? '未設定'}</dd>
            <dt>学年</dt>
            <dd>{profile.grade ?? '未設定'}</dd>
            <dt>ロール</dt>
            <dd>{profile.user.role}</dd>
            <dt>ステータス</dt>
            <dd>{profile.user.status}</dd>
          </dl>
        )}
      </main>
    </div>
  );
};
