import { useState, useEffect } from 'react';
import { UserHeader } from '../components/UserHeader';
// 1. updateMyProfile をインポートに追加
import { getMyProfile, getProfileByUserID, updateProfile, updateMyProfile } from '../api/profile';
import { Link, useNavigate } from 'react-router-dom';

export const UserProfileeditPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userID: '',
    username: '', 
    bio: '',
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const initFetch = async () => {
      try {
        const meRes = await getMyProfile();
        const myUserID = meRes.me.ID;

        const profileRes = await getProfileByUserID(myUserID);
        const profile = profileRes.getProfileByUserID;

        if (profile) {
          setFormData({
            userID: profile.userID,
            // 初期値として Userテーブルの name を表示させる
            username: profile.user?.name || '', 
            bio: profile.bio || '',
          });
        }
      } catch (err) {
        setError('プロフィールの取得に失敗しました');
        console.error(err);
      }
    };
    initFetch();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  try {
    await updateProfile(formData);
    await updateMyProfile({ name: formData.username });

    navigate('/mypage', { 
      state: { message: 'プロフィールを更新しました！' } 
    });

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
            ユーザー名:
            <input 
              type="text" 
              name="username"
              value={formData.username} 
              onChange={handleChange} 
            />
          </label>
          <label>
            自己紹介:
            <textarea 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange} 
            />
          </label>
          
          <button type="submit" disabled={!formData.userID}>更新</button>
        </form>
        <Link to="/mypage" style={{ marginTop: '1rem', display: 'inline-block' }}>マイページに戻る</Link>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </main>
    </div>
  );
};