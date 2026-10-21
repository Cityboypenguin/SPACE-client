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

  if (!user) return <p className={styles.pageCentered}>{error || '読み込み中...'}</p>;

  const isFrozen = user.status === STATUS_FROZEN;

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>ユーザー管理</h1>
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className={styles.paginationButton}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ChevronLeft /> 一覧に戻る
          </button>
        </div>

        {error && <p className={styles.centerError}>{error}</p>}

        <div className={styles.toolbar} style={{ marginBottom: '24px' }}>
          <div className={styles.toolbarGroup}>
            <button
              type="button"
              onClick={() => navigate(`/admin/users/${id}/profile`)}
              className={styles.paginationButton}
            >
              プロフィールを見る
            </button>
            <button
              type="button"
              onClick={() => navigate(`/admin/users/${id}/edit`)}
              className={styles.primaryButton}
            >
              情報を編集
            </button>
          </div>
        </div>

        <div className={styles.tablePanelPlain} style={{ marginBottom: '32px' }}>
          <table className={styles.table}>
            <tbody>
              <tr className={styles.tableRow}>
                <th className={styles.tableCellLarge} style={{ width: '180px', backgroundColor: '#f8fafc', fontWeight: 600 }}>ユーザーID</th>
                <td className={styles.tableCellLarge}>{user.accountID || user.ID}</td>
              </tr>
              <tr className={styles.tableRow}>
                <th className={styles.tableCellLarge} style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>名前</th>
                <td className={styles.tableCellLarge}>{user.name}</td>
              </tr>
              <tr className={styles.tableRow}>
                <th className={styles.tableCellLarge} style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>メールアドレス</th>
                <td className={styles.tableCellLarge}>{user.email || '-'}</td>
              </tr>
              <tr className={styles.tableRow}>
                <th className={styles.tableCellLarge} style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>ロール</th>
                <td className={styles.tableCellLarge}>{user.role}</td>
              </tr>
              <tr className={styles.tableRow}>
                <th className={styles.tableCellLarge} style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>ステータス</th>
                <td className={styles.tableCellLarge}>
                  <span
                    className={styles.userStatusBadge}
                    data-status={isFrozen ? 'frozen' : 'active'}
                  >
                    {isFrozen ? '凍結中' : 'アクティブ'}
                  </span>
                </td>
              </tr>
              <tr className={styles.tableRow}>
                <th className={styles.tableCellLarge} style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>登録日時</th>
                <td className={`${styles.tableCellLarge} ${styles.cellMuted}`}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleString('ja-JP') : '-'}
                </td>
              </tr>
              <tr className={styles.tableRow}>
                <th className={styles.tableCellLarge} style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>更新日時</th>
                <td className={`${styles.tableCellLarge} ${styles.cellMuted}`}>
                  {user.updatedAt ? new Date(user.updatedAt).toLocaleString('ja-JP') : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>
            交友関係 (管理者閲覧用)
          </h2>
          {relationsLoading ? (
            <p className={styles.cellMuted}>読み込み中...</p>
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

        {freezeError && <p className={styles.centerError} style={{ marginTop: '24px' }}>{freezeError}</p>}

        <div className={styles.toolbar} style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <div className={styles.toolbarGroup}>
            {isFrozen ? (
              <button
                type="button"
                onClick={handleUnfreeze}
                className={styles.primaryButton}
              >
                凍結を解除する
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFreeze}
                className={styles.paginationButton}
                style={{ color: '#d97706', borderColor: '#fcd34d' }}
              >
                ユーザーを凍結する
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className={styles.primaryButton}
              style={{ backgroundColor: '#ef4444' }}
            >
              このユーザーを削除する
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
