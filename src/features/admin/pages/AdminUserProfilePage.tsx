import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserByID, getProfileByUserID, adminUpdateProfile, type User, type Profile } from '../api/users';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { storageUrl } from '../../../lib/storage';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import styles from '../styles/AdminShared.module.css';

export const AdminUserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [bio, setBio] = useState('');
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
      })
      .catch(() => setError('プロフィールの取得に失敗しました'));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    if (!id) return;
    try {
      const input: { bio?: string } = {};
      if (bio !== (profile?.bio ?? '')) input.bio = bio;
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
      <main className={styles.page}>
        <button onClick={() => navigate(`/admin/users/${id}`)}><ChevronLeft /> 詳細に戻る</button>
        <h1>{user.name} のプロフィール</h1>

        {error && <p className={styles.errorText}>{error}</p>}

        {profile === undefined ? (
          <p>読み込み中...</p>
        ) : (
          <>
            <section className={styles.analyticsSection}>
              <h2>現在のプロフィール</h2>
              {profile === null ? (
                <p className={styles.mutedText}>プロフィールが未設定です</p>
              ) : (
                <dl className={styles.definitionList}>
                  <dt><strong>ユーザー名</strong></dt>
                  <dd>{profile.username}</dd>
                  <dt><strong>自己紹介</strong></dt>
                  <dd>{profile.bio ?? '未設定'}</dd>
                  <dt><strong>アイコン画像</strong></dt>
                  <dd>
                    {profile.avatarUrl ? (
                      <img
                        src={storageUrl(profile.avatarUrl) ?? undefined}
                        alt="プロフィール画像"
                        className={styles.profileImage}
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
              {editError && <p className={styles.errorText}>{editError}</p>}
              {editSuccess && <p className={styles.successText}>{editSuccess}</p>}
              <form
                onSubmit={handleSubmit}
                className={styles.formColumn}
              >
                <div>
                  <label>自己紹介</label><br />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className={styles.fullWidth}
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
