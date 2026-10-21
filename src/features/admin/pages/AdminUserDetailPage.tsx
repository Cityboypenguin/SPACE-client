import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserByID, deleteUser, freezeUser, unfreezeUser, type User } from '../api/users';
import { adminGetBlockers, adminGetFavoriteUsers, type RelatedUser } from '../api/relation';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { AdminUserTimetableSection } from '../components/organisms/AdminUserTimetableSection';
import { UserListItem } from '../../../components/molecules/UserListItem';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import styles from '../styles/AdminShared.module.css';

const STATUS_FROZEN = 'frozen';

export const AdminUserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [freezeError, setFreezeError] = useState('');

  const [favorites, setFavorites] = useState<RelatedUser[]>([]);
  const [blockers, setBlockers] = useState<RelatedUser[]>([]);
  const [relationsLoading, setRelationsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getUserByID(id)
      .then((data) => setUser(data.getUserByID))
      .catch(() => setError('ユーザー情報の取得に失敗しました'));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const fetchRelations = async () => {
      setRelationsLoading(true);
      try {
        const [favData, blockData] = await Promise.all([
          adminGetFavoriteUsers(id),
          adminGetBlockers(id)
        ]);
        if (active) {
          setFavorites(favData || []);
          setBlockers(blockData || []);
        }
      } catch (err) {
        console.error('交友関係の取得に失敗しました', err);
      } finally {
        if (active) setRelationsLoading(false);
      }
    };
    fetchRelations();
    return () => { active = false; };
  }, [id]);

  const handleDelete = async () => {
    if (!id || !user) return;
    if (!window.confirm(`${user.name} を削除しますか？`)) return;
    try {
      await deleteUser(id);
      navigate('/admin/users');
    } catch {
      setError('削除に失敗しました');
    }
  };

  const handleFreeze = async () => {
    if (!id || !user) return;
    if (!window.confirm(`${user.name} を凍結しますか？`)) return;
    setFreezeError('');
    try {
      await freezeUser(id);
      setUser((prev) => prev ? { ...prev, status: STATUS_FROZEN } : prev);
    } catch {
      setFreezeError('凍結に失敗しました');
    }
  };

  const handleUnfreeze = async () => {
    if (!id || !user) return;
    if (!window.confirm(`${user.name} の凍結を解除しますか？`)) return;
    setFreezeError('');
    try {
      await unfreezeUser(id);
      setUser((prev) => prev ? { ...prev, status: 'active' } : prev);
    } catch {
      setFreezeError('解除に失敗しました');
    }
  };

  if (!user) return <p>読み込み中...</p>;

  const isFrozen = user.status === STATUS_FROZEN;

  return (
    <div>
      <AdminHeader />
      <main className={styles.page}>
        <button
          onClick={() => navigate('/admin/users')}
          className={styles.paginationButton}
          style={{ marginBottom: '16px' }}
        >
          <ChevronLeft /> 一覧に戻る
        </button>

        <h1>ユーザー詳細</h1>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.buttonRowCompactSpaced} style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate(`/admin/users/${id}/profile`)}
            className={styles.paginationButton}
          >
            プロフィールを見る
          </button>
          <button
            onClick={() => navigate(`/admin/users/${id}/edit`)}
            className={styles.primaryButton}
          >
            情報を編集
          </button>
        </div>

        <table className={styles.compactTable} style={{ marginBottom: '32px' }}>
          <tbody>
            <tr>
              <th style={{ width: '180px' }}>ユーザーID</th>
              <td>{user.accountID || user.ID}</td>
            </tr>
            <tr>
              <th>名前</th>
              <td>{user.name}</td>
            </tr>
            <tr>
              <th>メールアドレス</th>
              <td>{user.email || '-'}</td>
            </tr>
            <tr>
              <th>ロール</th>
              <td>{user.role}</td>
            </tr>
            <tr>
              <th>ステータス</th>
              <td>
                <span
                  className={styles.userStatusBadge}
                  data-status={isFrozen ? 'frozen' : 'active'}
                >
                  {isFrozen ? '凍結中' : 'アクティブ'}
                </span>
              </td>
            </tr>
            <tr>
              <th>登録日時</th>
              <td>{user.createdAt ? new Date(user.createdAt).toLocaleString('ja-JP') : '-'}</td>
            </tr>
            <tr>
              <th>更新日時</th>
              <td>{user.updatedAt ? new Date(user.updatedAt).toLocaleString('ja-JP') : '-'}</td>
            </tr>
          </tbody>
        </table>

        <hr className={styles.divider} />

        <div className={styles.relationshipSection}>
          <h2 className={styles.relationshipTitle}>交友関係 (管理者閲覧用)</h2>
          {relationsLoading ? (
            <p>読み込み中...</p>
          ) : (
            <div className={styles.relationshipGrid}>
              <div className={styles.relationshipCard}>
                <h3 className={styles.relationshipCardTitle}>
                  お気に入り ({favorites.length})
                </h3>
                {favorites.length === 0 ? (
                  <p className={styles.mutedSmall}>登録なし</p>
                ) : (
                  <ul className={styles.scrollList}>
                    {favorites.map((fUser) => (
                      <UserListItem key={fUser.ID} user={fUser} basePath="/admin/users" />
                    ))}
                  </ul>
                )}
              </div>

              <div className={styles.relationshipCard}>
                <h3 className={`${styles.relationshipCardTitle} ${styles.errorText}`}>
                  ブロック ({blockers.length})
                </h3>
                {blockers.length === 0 ? (
                  <p className={styles.mutedSmall}>ブロックなし</p>
                ) : (
                  <ul className={styles.scrollList}>
                    {blockers.map((bUser) => (
                      <UserListItem key={bUser.ID} user={bUser} basePath="/admin/users" />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {id && <AdminUserTimetableSection userID={id} />}

        <hr className={styles.divider} />

        {freezeError && <p className={styles.errorText}>{freezeError}</p>}

        <div className={styles.buttonRow} style={{ marginTop: '24px' }}>
          {isFrozen ? (
            <button
              onClick={handleUnfreeze}
              className={styles.primaryButton}
            >
              凍結を解除する
            </button>
          ) : (
            <button
              onClick={handleFreeze}
              className={styles.freezeButton}
            >
              ユーザーを凍結する
            </button>
          )}
          <button
            onClick={handleDelete}
            className={styles.dangerButton}
          >
            このユーザーを削除する
          </button>
        </div>
      </main>
    </div>
  );
};
