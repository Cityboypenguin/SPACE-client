import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  getCommunities,
  updateCommunity,
  kickUserFromCommunity,
  getCommunityRoom,
  type Community,
  type RoomUser,
} from '../api/communities';
import { AdminHeader } from '../components/AdminHeader';

export const AdminCommunityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [community, setCommunity] = useState<Community | null>(
    (location.state as { community?: Community })?.community ?? null,
  );
  const [members, setMembers] = useState<RoomUser[]>([]);
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
        fetchMembers(found.roomID);
      }
    } catch {
      setError('コミュニティ情報の取得に失敗しました');
    }
  };

  const fetchMembers = async (roomID: string) => {
    try {
      const data = await getCommunityRoom(roomID);
      setMembers(data.room?.user ?? []);
    } catch {
      setMembersError('メンバー一覧の取得に失敗しました');
    }
  };

  useEffect(() => {
    if (community) {
      setName(community.name);
      setDescription(community.description);
      fetchMembers(community.roomID);
    } else {
      fetchCommunity();
    }
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

  const handleKick = async (userID: string, userName: string) => {
    if (!id) return;
    if (!window.confirm(`${userName} をコミュニティから削除しますか？`)) return;
    try {
      await kickUserFromCommunity(id, userID);
      setMembers((prev) => prev.filter((m) => m.ID !== userID));
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
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.ID}>
                  <td>{member.accountID}</td>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>
                    <button
                      onClick={() => handleKick(member.ID, member.name)}
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
