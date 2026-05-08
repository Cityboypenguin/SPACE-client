import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserByID, getProfileByUserID, adminUpdateProfile, type User, type Profile } from '../api/users';
import { AdminHeader } from '../components/organisms/AdminHeader';

export const AdminUserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    getUserByID(id)
      .then((data) => {
        setUser(data.getUserByID);
        return getProfileByUserID(id);
      })
      .then((data) => {
        const p = data.getProfileByUserID;
        setProfile(p);
        setBio(p?.bio ?? '');
        setImage(p?.image ?? '');
      })
      .catch(() => setError('プロフィールの取得に失敗しました'));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    if (!id) return;
    try {
      const input: { bio?: string; image?: string } = {};
      if (bio !== (profile?.bio ?? '')) input.bio = bio;
      if (image !== (profile?.image ?? '')) input.image = image;
      const data = await adminUpdateProfile(id, input);
      setProfile(data.adminUpdateProfile);
      setEditSuccess('更新しました');
    } catch {
      setEditError('更新に失敗しました');
    }
  };

  if (!user) return <p>読み込み中...</p>;

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <button onClick={() => navigate(`/admin/users/${id}`)}>← 詳細に戻る</button>
        <h1>{user.name} のプロフィール</h1>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {profile === undefined ? (
          <p>読み込み中...</p>
        ) : (
          <>
            <section style={{ marginBottom: '2rem' }}>
              <h2>現在のプロフィール</h2>
              {profile === null ? (
                <p style={{ color: '#94a3b8' }}>プロフィールが未設定です</p>
              ) : (
                <dl style={{ lineHeight: '2' }}>
                  <dt><strong>ユーザー名</strong></dt>
                  <dd>{profile.username}</dd>
                  <dt><strong>自己紹介</strong></dt>
                  <dd>{profile.bio ?? '未設定'}</dd>
                  <dt><strong>アイコン画像</strong></dt>
                  <dd>
                    {profile.image ? (
                      <img
                        src={profile.image}
                        alt="プロフィール画像"
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      '未設定'
                    )}
                  </dd>
                  <dt><strong>プロフィール作成日</strong></dt>
                  <dd>{profile.createdAt}</dd>
                  <dt><strong>プロフィール更新日</strong></dt>
                  <dd>{profile.updatedAt}</dd>
                </dl>
              )}
            </section>

            <section>
              <h2>プロフィールの編集</h2>
              {editError && <p style={{ color: 'red' }}>{editError}</p>}
              {editSuccess && <p style={{ color: 'green' }}>{editSuccess}</p>}
              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}
              >
                <div>
                  <label>自己紹介</label><br />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    style={{ width: '100%' }}
                    placeholder="自己紹介を入力"
                  />
                </div>
                <button type="submit">保存</button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
};
