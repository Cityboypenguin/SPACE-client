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

  if (!user) return <p className={styles.pageCentered}>{error || '読み込み中...'}</p>;

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>ユーザー詳細</h1>
        </div>

        {error && <p className={styles.centerError}>{error}</p>}

        <button
            type="button"
            onClick={() => navigate(`/admin/users/${id}`)}
            className={styles.paginationButton}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ChevronLeft /> 詳細に戻る
          </button>

        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {profile === undefined ? (
            <p className={styles.cellMuted}>読み込み中...</p>
          ) : (
            <>
              {/* 現在のプロフィール表示 */}
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>{user.name} のプロフィール</h2>
                {profile === null ? (
                  <div className={styles.tablePanelPlain} style={{ padding: '24px', textAlign: 'center' }}>
                    <p className={styles.emptyState}>プロフィールが未設定です</p>
                  </div>
                ) : (
                  <div className={styles.tablePanelPlain}>
                    <table className={styles.table}>
                      <tbody>
                        <tr className={styles.tableRow}>
                          <th className={styles.tableCellLarge} style={{ width: '160px', backgroundColor: '#f8fafc', fontWeight: 600 }}>ユーザー名</th>
                          <td className={styles.tableCellLarge}>{profile.username || '-'}</td>
                        </tr>
                        <tr className={styles.tableRow}>
                          <th className={styles.tableCellLarge} style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>アイコン画像</th>
                          <td className={styles.tableCellLarge}>
                            {profile.avatarUrl ? (
                              <img
                                src={storageUrl(profile.avatarUrl) ?? undefined}
                                alt="プロフィール画像"
                                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                              />
                            ) : (
                              <span className={styles.cellMuted}>未設定</span>
                            )}
                          </td>
                        </tr>
                        <tr className={styles.tableRow}>
                          <th className={styles.tableCellLarge} style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>自己紹介</th>
                          <td className={styles.tableCellLarge} style={{ whiteSpace: 'pre-wrap' }}>
                            {profile.bio || <span className={styles.cellMuted}>未設定</span>}
                          </td>
                        </tr>
                        <tr className={styles.tableRow}>
                          <th className={styles.tableCellLarge} style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>作成日時</th>
                          <td className={`${styles.tableCellLarge} ${styles.cellMuted}`}>
                            {profile.createdAt ? new Date(profile.createdAt).toLocaleString('ja-JP') : '-'}
                          </td>
                        </tr>
                        <tr className={styles.tableRow}>
                          <th className={styles.tableCellLarge} style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>更新日時</th>
                          <td className={`${styles.tableCellLarge} ${styles.cellMuted}`}>
                            {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString('ja-JP') : '-'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* プロフィールの編集 */}
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>プロフィールの編集</h2>
                {editError && <p className={styles.centerError}>{editError}</p>}
                {editSuccess && <p className={styles.centerError} style={{ color: '#10b981' }}>{editSuccess}</p>}

                <form onSubmit={handleSubmit} className={styles.tablePanelPlain} style={{ padding: '24px', boxSizing: 'border-box' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      自己紹介
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className={styles.select}
                      placeholder="自己紹介を入力"
                      style={{ width: '100%', boxSizing: 'border-box', height: 'auto', padding: '8px 12px', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/users/${id}`)}
                      className={styles.paginationButton}
                    >
                      キャンセル
                    </button>
                    <button type="submit" className={styles.primaryButton}>
                      保存
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
