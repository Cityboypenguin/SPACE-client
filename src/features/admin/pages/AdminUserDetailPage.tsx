import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserByID, deleteUser, freezeUser, unfreezeUser, type User } from '../api/users';
import { adminGetBlockers, adminGetFavoriteUsers } from '../api/relation';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { UserListItem } from '../../../components/molecules/UserListItem';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';

const STATUS_FROZEN = 'frozen';

export const AdminUserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [freezeError, setFreezeError] = useState('');

  const [favorites, setFavorites] = useState<User[]>([]);
  const [blockers, setBlockers] = useState<User[]>([]);
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
      <main style={{ padding: '2rem' }}>
        <button onClick={() => navigate(-1)}><ChevronLeft /> 戻る</button>
        <h1>ユーザー詳細</h1>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => navigate(`/admin/users/${id}/profile`)}>プロフィールを見る</button>
          <button onClick={() => navigate(`/admin/users/${id}/edit`)}>情報を編集</button>
        </div>

        <dl>
          <dt>ユーザーID</dt>
          <dd>{user.accountID}</dd>
          <dt>名前</dt>
          <dd>{user.name}</dd>
          <dt>メールアドレス</dt>
          <dd>{user.email}</dd>
          <dt>ロール</dt>
          <dd>{user.role}</dd>
          <dt>ステータス</dt>
          <dd>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 12,
                fontSize: '0.85rem',
                fontWeight: 600,
                background: isFrozen ? '#dbeafe' : '#dcfce7',
                color: isFrozen ? '#1d4ed8' : '#16a34a',
              }}
            >
              {isFrozen ? '凍結中' : 'アクティブ'}
            </span>
          </dd>
          <dt>登録日時</dt>
          <dd>{user.createdAt}</dd>
          <dt>更新日時</dt>
          <dd>{user.updatedAt}</dd>
        </dl>

        <div style={{ marginTop: '2rem', marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1rem' }}>交友関係 (管理者閲覧用)</h2>
          {relationsLoading ? (
            <p>読み込み中...</p>
          ) : (
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

              <div style={{ flex: 1, minWidth: '300px', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '1rem', marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                  お気に入り ({favorites.length})
                </h3>
                {favorites.length === 0 ? (
                  <p style={{ color: 'gray', fontSize: '0.9rem' }}>登録なし</p>
                ) : (
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    {favorites.map(fUser => (
                      <UserListItem key={fUser.ID} user={fUser} basePath="/admin/users" />
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ flex: 1, minWidth: '300px', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '1rem', marginTop: 0, color: '#ef4444', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                  ブロック ({blockers.length})
                </h3>
                {blockers.length === 0 ? (
                  <p style={{ color: 'gray', fontSize: '0.9rem' }}>ブロックなし</p>
                ) : (
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    {blockers.map(bUser => (
                      <UserListItem key={bUser.ID} user={bUser} basePath="/admin/users" />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <hr />

        {freezeError && <p style={{ color: 'red' }}>{freezeError}</p>}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isFrozen ? (
            <button
              onClick={handleUnfreeze}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 8,
                border: '1px solid #93c5fd',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              凍結を解除する
            </button>
          ) : (
            <button
              onClick={handleFreeze}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 8,
                border: '1px solid #93c5fd',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ユーザーを凍結する
            </button>
          )}
          <button
            onClick={handleDelete}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 8,
              border: '1px solid #fca5a5',
              background: '#fff',
              color: '#ef4444',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            このユーザーを削除する
          </button>
        </div>
      </main>
    </div>
  );
};
