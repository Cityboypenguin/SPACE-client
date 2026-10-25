import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import {
  getCommunity,
  getCommunityMembers,
  updateCommunity,
  kickUserFromCommunity,
  promoteToCommunityOwner,
  demoteFromCommunityOwner,
  listRoomMessages,
  adminMessagePageSize,
  adminDeleteMessage,
  type Community,
  type CommunityMember,
  type Message,
} from '../api/communities';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { storageUrl } from '../../../lib/storage';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [membersError, setMembersError] = useState('');
  const [messagesError, setMessagesError] = useState('');

  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [oldestMessageID, setOldestMessageID] = useState<string | null>(null);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const loadingOlderRef = useRef(false);
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

  const fetchMessages = useCallback(async (roomID: string) => {
    try {
      const data = await listRoomMessages(roomID);
      setMessages(data.messages.items);
      setHasOlderMessages(data.messages.hasMoreBefore);
      setOldestMessageID(data.messages.items[0]?.ID ?? null);
    } catch {
      setMessagesError('メッセージ一覧の取得に失敗しました');
    }
  }, []);

  const roomID = community?.roomID;
  const loadOlderMessages = useCallback(async () => {
    if (!roomID || !oldestMessageID || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setLoadingOlderMessages(true);
    try {
      const data = await listRoomMessages(roomID, adminMessagePageSize, oldestMessageID);
      setMessages((prev) => [...data.messages.items, ...prev]);
      setHasOlderMessages(data.messages.hasMoreBefore);
      setOldestMessageID(data.messages.items[0]?.ID ?? oldestMessageID);
    } catch {
      setMessagesError('メッセージ一覧の取得に失敗しました');
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlderMessages(false);
    }
  }, [roomID, oldestMessageID]);

  useEffect(() => {
    if (!community) void Promise.resolve().then(fetchCommunity);
  }, [community, fetchCommunity]);

  useEffect(() => {
    if (community) {
      setName(community.name);
      setDescription(community.description || '');
    }
  }, [community]);

  useEffect(() => {
    void Promise.resolve().then(fetchMembers);
  }, [fetchMembers]);

  useEffect(() => {
    if (community?.roomID) {
      void Promise.resolve().then(() => fetchMessages(community.roomID));
    }
  }, [community?.roomID, fetchMessages]);

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

  const handleDeleteMessage = async (message: Message) => {
    if (!window.confirm('このメッセージを削除しますか？')) return;
    try {
      await adminDeleteMessage(message.roomID, message.ID);
      setMessages((prev) => prev.filter((m) => m.ID !== message.ID));
    } catch {
      setError('メッセージの削除に失敗しました');
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

          {/* 右カラム：チャット履歴（縦スクロール表示） */}
          <div>
            <div className={styles.toolbar} style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>チャット履歴</h2>
              {hasOlderMessages && (
                <button
                  type="button"
                  onClick={loadOlderMessages}
                  disabled={loadingOlderMessages}
                  className={styles.paginationButton}
                >
                  {loadingOlderMessages ? '読み込み中...' : '過去のメッセージ'}
                </button>
              )}
            </div>

            {messagesError && <p className={styles.centerError}>{messagesError}</p>}
            {messages.length > 0 ? (
              <div className={styles.tablePanelPlain} style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeaderRow} style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc' }}>
                      <th className={styles.tableCellLarge}>投稿者</th>
                      <th className={styles.tableCellLarge}>内容</th>
                      <th className={styles.tableCellLarge}>日時</th>
                      <th className={styles.tableCellLarge}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((message) => (
                      <tr key={message.ID} className={styles.tableRow}>
                        <td className={styles.tableCellLarge} style={{ minWidth: '120px' }}>
                          <div style={{ fontWeight: 600 }}>{message.user.name}</div>
                          <div className={styles.cellMuted} style={{ fontSize: '0.8rem' }}>@{message.user.accountID}</div>
                        </td>
                        <td className={styles.tableCellLarge}>
                          {message.content && <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>}
                          {message.media && message.media.length > 0 && (
                            <div className={`${styles.mediaList} ${message.content ? styles.mediaListSpaced : ''}`} style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {message.media.map((m) =>
                                m.contentType.startsWith('image/') ? (
                                  <a key={m.ID} href={storageUrl(m.url)} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={storageUrl(m.url)}
                                      alt="添付画像"
                                      className={styles.mediaThumb}
                                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                    />
                                  </a>
                                ) : (
                                  <a
                                    key={m.ID}
                                    href={storageUrl(m.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.fileLink}
                                  >
                                    {m.contentType.split('/')[1]?.toUpperCase() ?? 'FILE'}
                                  </a>
                                )
                              )}
                            </div>
                          )}
                        </td>
                        <td className={`${styles.tableCellLarge} ${styles.cellMuted}`} style={{ minWidth: '130px', fontSize: '0.8rem' }}>
                          {new Date(message.createdAt).toLocaleString('ja-JP')}
                        </td>
                        <td className={styles.tableCellLarge}>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(message)}
                            className={styles.primaryButton}
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !messagesError && <p className={styles.emptyState}>メッセージはありません</p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};
