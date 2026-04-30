import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { getMyProfile, getProfileByUserID, updateProfile } from '../api/profile';

export const UserProfileEditPage = () => {
  const navigate = useNavigate();
  const [userID, setUserID] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await getMyProfile();
        const myUserID = meRes.me.ID;
        setUserID(myUserID);

        const profileRes = await getProfileByUserID(myUserID);
        const profile = profileRes.getProfileByUserID;
        if (profile) {
          setBio(profile.bio || '');
        }
      } catch (err) {
        setError('プロフィールの取得に失敗しました');
        console.error(err);
      }
    };
    void init();
  }, []);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    try {
      await updateProfile({ bio });
      navigate('/mypage', { state: { message: 'プロフィールを更新しました！' } });
    } catch (err) {
      setError('更新に失敗しました。');
      console.error(err);
    }
  };

  return (
    <div>
      <UserHeader />
      <main style={{ padding: '2rem' }}>
        <h1>プロフィール編集</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 400 }}>
          <label>
            自己紹介:
            <textarea
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </label>
          <button type="submit">更新</button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <Link to="/mypage" style={{ marginTop: '1rem', display: 'inline-block' }}>マイページに戻る</Link>
      </main>
    </div>
  );
};
