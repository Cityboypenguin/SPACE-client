import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  getCommunities,
  getCommunityMembers,
  updateCommunity,
  kickUserFromCommunity,
  type Community,
  type CommunityMember,
} from '../api/communities';
import { AdminHeader } from '../components/organisms/AdminHeader';

const ROLE_OWNER = 'owner';

export const AdminCommunityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [community, setCommunity] = useState<Community | null>(
    (location.state as { community?: Community })?.community ?? null,
  );
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [membersError, setMembersError] = useState('');

  const fetchCommunity = async () => {
    if (!id) return;
    try {
      const data = await getCommunities();
      const found = data.communities.find((c) => c.ID === id);
      if (found) {
        setCommunity(found);
        setName(found.name);
        setDescription(found.description);
      }
    } catch {
      setError('コミュニティ情報の取得に失敗しました');
    }
  };

  const fetchMembers = async () => {
    if (!id) return;
    try {
      const data = await getCommunityMembers(id);
      setMembers(data.getCommunityMembers);
    } catch {
      setMembersError('メンバー一覧の取得に失敗しました');
    }
  };

  useEffect(() => {
    if (community) {
      setName(community.name);
      setDescription(community.description);
    } else {
      fetchCommunity();
    }
    fetchMembers();
  }, [id]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!id || !community) return;
    try {
      const input: { name?: string; description?: string } = {};
      if (name !== community.name) input.name = name;
      if (description !== community.description) input.description = description;
      await updateCommunity(id, input);
      setSuccess('更新しました');
      await fetchCommunity();
    } catch {
      setError('更新に失敗しました');
    }
  };

  const handleKick = async (member: CommunityMember) => {
    if (!id) return;
    if (!window.confirm(`${member.user.name} をコミュニティから削除しますか？`)) return;
    try {
      await kickUserFromCommunity(id, member.user.ID);
      setMembers((prev) => prev.filter((m) => m.user.ID !== member.user.ID));
    } catch {
      setError('キックに失敗しました');
    }
  };

  if (!community) return <p>読み込み中...</p>;

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <button onClick={() => navigate('/admin/communities')}>← 一覧に戻る</button>
        <h1>コミュニティ詳細</h1>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <h2>コミュニティ情報の編集</h2>
        <form
          onSubmit={handleUpdateSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}
        >
          <div>
            <label>名前</label><br />
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label>説明</label><br />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ width: '100%' }}
            />
          </div>
          <button type="submit">保存</button>
        </form>

        <hr style={{ margin: '2rem 0' }} />

        <h2>メンバー一覧</h2>
        {membersError && <p style={{ color: 'red' }}>{membersError}</p>}
        {members.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ユーザーID</th>
                <th>名前</th>
                <th>メールアドレス</th>
                <th>ロール</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.user.ID}>
                  <td>{member.user.accountID}</td>
                  <td>
                    {member.user.name}
                  </td>
                  <td>{member.user.email}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: member.role === ROLE_OWNER ? '#ede9fe' : '#f1f5f9',
                        color: member.role === ROLE_OWNER ? '#7c3aed' : '#64748b',
                      }}
                    >
                      {member.role === ROLE_OWNER ? 'オーナー' : 'メンバー'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleKick(member)}
                      style={{ color: 'red' }}
                    >
                      キック
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !membersError && <p>メンバーはいません</p>
        )}
      </main>
    </div>
  );
};
