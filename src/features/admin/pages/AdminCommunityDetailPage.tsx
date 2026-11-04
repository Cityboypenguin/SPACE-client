import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import {
  getCommunity,
  getCommunityMembers,
  updateCommunity,
  kickUserFromCommunity,
  promoteToCommunityOwner,
  demoteFromCommunityOwner,
  type Community,
  type CommunityMember,
} from '../api/communities';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { AdminChatView } from '../components/organisms/AdminChatView';
import { AdminThreadSection } from '../components/molecules/AdminThreadSection';
import styles from '../styles/AdminShared.module.css';

const ROLE_OWNER = 'owner';

export const AdminCommunityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [community, setCommunity] = useState<Community | null>(
    (location.state as { community?: Community })?.community ?? null,
  );
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [name, setName] = useState(community?.name ?? '');
  const [description, setDescription] = useState(community?.description ?? '');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [membersError, setMembersError] = useState('');

  const [memberOffset, setMemberOffset] = useState(0);
  const [memberTotal, setMemberTotal] = useState(0);
  const memberPageSize = 50;

  const fetchCommunity = useCallback(async () => {
    if (!id) return;
    try {
      const found = await getCommunity(id);
      if (found) {
        setCommunity(found);
        setName(found.name);
        setDescription(found.description || '');
      }
    } catch {
      setError('コミュニティ情報の取得に失敗しました');
    }
  }, [id]);

  const fetchMembers = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getCommunityMembers(id, memberPageSize, memberOffset);
      setMembers(data.communityMembers.items);
      setMemberTotal(data.communityMembers.total);
    } catch {
      setMembersError('メンバー一覧の取得に失敗しました');
    }
  }, [id, memberOffset]);

  useEffect(() => {
    if (!community) void Promise.resolve().then(fetchCommunity);
  }, [community, fetchCommunity]);

  useEffect(() => {
    void Promise.resolve().then(fetchMembers);
  }, [fetchMembers]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!id || !community) return;
    try {
      const input: { name?: string; description?: string } = {};
      if (name !== community.name) input.name = name;
      if (description !== community.description) input.description = description;

      if (Object.keys(input).length === 0) {
        setSuccess('変更はありません');
        return;
      }

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

  const handleToggleRole = async (member: CommunityMember) => {
    if (!id) return;
    const isOwner = member.role === ROLE_OWNER;
    const label = isOwner ? 'メンバーに降格' : 'オーナーに昇格';
    if (!window.confirm(`${member.user.name} を${label}しますか？`)) return;
    setError('');
    try {
      if (isOwner) {
        await demoteFromCommunityOwner(id, member.user.ID);
      } else {
        await promoteToCommunityOwner(id, member.user.ID);
      }
      setMembers((prev) =>
        prev.map((m) =>
          m.user.ID === member.user.ID ? { ...m, role: isOwner ? 'member' : ROLE_OWNER } : m,
        ),
      );
    } catch {
      setError(`${label}に失敗しました`);
    }
  };

  if (!community) return <p className={styles.pageCentered}>{error || '読み込み中...'}</p>;

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>コミュニティ詳細</h1>
        </div>

        {error && <p className={styles.centerError}>{error}</p>}
        {success && <p className={styles.centerError} style={{ color: '#10b981' }}>{success}</p>}
        <button
            type="button"
            onClick={() => navigate('/admin/communities')}
            className={styles.paginationButton}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ChevronLeft /> 一覧に戻る
          </button>
        {/* 左右2カラム構造 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* 左カラム：コミュニティ情報の編集 ＆ メンバー一覧 */}
          <div>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>コミュニティ情報の編集</h2>
              <form onSubmit={handleUpdateSubmit} className={styles.tablePanelPlain} style={{ padding: '20px', boxSizing: 'border-box' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>名前</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.select}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>説明</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className={styles.select}
                    style={{ width: '100%', boxSizing: 'border-box', height: 'auto', padding: '8px 12px', resize: 'vertical' }}
                  />
                </div>

                <button type="submit" className={styles.primaryButton}>保存</button>
              </form>
            </div>

            {/* メンバー一覧 */}
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>メンバー一覧 ({memberTotal})</h2>
              {membersError && <p className={styles.centerError}>{membersError}</p>}
              {members.length > 0 ? (
                <div className={styles.tablePanelPlain}>
                  <table className={styles.table}>
                    <thead>
                      <tr className={styles.tableHeaderRow}>
                        <th className={styles.tableCellLarge}>ユーザーID</th>
                        <th className={styles.tableCellLarge}>名前</th>
                        <th className={styles.tableCellLarge}>ロール</th>
                        <th className={styles.tableCellLarge}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.user.ID} className={styles.tableRow}>
                          <td className={`${styles.tableCellLarge} ${styles.cellMuted}`}>@{member.user.accountID}</td>
                          <td className={styles.tableCellLarge}>{member.user.name}</td>
                          <td className={styles.tableCellLarge}>
                            <span className={`${styles.roleBadge} ${member.role === ROLE_OWNER ? styles.roleBadgeOwner : styles.roleBadgeMember}`}>
                              {member.role === ROLE_OWNER ? 'オーナー' : 'メンバー'}
                            </span>
                          </td>
                          <td className={styles.tableCellLarge}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleRole(member)}
                                className={styles.paginationButton}
                              >
                                {member.role === ROLE_OWNER ? '降格' : '昇格'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleKick(member)}
                                className={styles.primaryButton}
                                style={{ backgroundColor: '#ef4444' }}
                              >
                                キック
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                !membersError && <p className={styles.emptyState}>メンバーはいません</p>
              )}
              {memberTotal > memberPageSize && (
                <div className={styles.toolbar} style={{ marginTop: '12px' }}>
                  <button
                    disabled={memberOffset === 0}
                    onClick={() => setMemberOffset(Math.max(0, memberOffset - memberPageSize))}
                    className={styles.paginationButton}
                  >
                    前へ
                  </button>
                  <span className={styles.cellMuted}>
                    {Math.floor(memberOffset / memberPageSize) + 1} / {Math.ceil(memberTotal / memberPageSize)}
                  </span>
                  <button
                    disabled={memberOffset + memberPageSize >= memberTotal}
                    onClick={() => setMemberOffset(memberOffset + memberPageSize)}
                    className={styles.paginationButton}
                  >
                    次へ
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 右カラム：チャット履歴（ユーザー側のチャット画面と同じ見た目）とスレッド */}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 16px' }}>チャット履歴</h2>
            {community.roomID && (
              <AdminChatView
                key={community.roomID}
                roomID={community.roomID}
                height="calc(100vh - 200px)"
                onOpenThread={(threadID) => navigate(`/admin/communities/${id}/threads/${encodeURIComponent(threadID)}`)}
              />
            )}

            {community.roomID && (
              <div style={{ marginTop: '24px' }}>
                <AdminThreadSection parentRoomID={community.roomID} basePath={`/admin/communities/${id}`} />
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};
