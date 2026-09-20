import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import {
  getCommunities,
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
  // メッセージはカーソル方式で古い側へ辿る（messages クエリが before を取るため）。
  // 総件数は返らないので「まだ古いものがあるか」だけを持つ。
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  // 継ぎ足しの起点。messages そのものを見ると、配列が変わるたびに
  // loadOlderMessages が作り直される（＝ボタンの再生成が毎回走る）。
  // 必要なのは「一番古いID」の1つだけなので、それだけを持つ。
  const [oldestMessageID, setOldestMessageID] = useState<string | null>(null);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  // 二重押しの防止は ref で持つ。state を判定に使うと、それが依存に入って
  // loadOlderMessages が読み込みのたびに作り直される。
  const loadingOlderRef = useRef(false);
  const [memberOffset, setMemberOffset] = useState(0);
  const [memberTotal, setMemberTotal] = useState(0);
  const memberPageSize = 50;

  const fetchCommunity = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getCommunities();
      const found = data.communities.items.find((c) => c.ID === id);
      if (found) {
        setCommunity(found);
        setName(found.name);
        setDescription(found.description);
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

  // 古い側を1ページぶん継ぎ足す。items は常に古い順で返るので、
  // いま持っている中で一番古い ID を before に渡し、返ってきたぶんを前へ足す。
  const roomID = community?.roomID;
  const loadOlderMessages = useCallback(async () => {
    if (!roomID || !oldestMessageID || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setLoadingOlderMessages(true);
    try {
      const data = await listRoomMessages(roomID, adminMessagePageSize, oldestMessageID);
      setMessages(prev => [...data.messages.items, ...prev]);
      setHasOlderMessages(data.messages.hasMoreBefore);
      // 何も返らなければ起点は据え置き（これ以上古いものは無い）。
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
    void Promise.resolve().then(() => {
      if (!community) return;
      setName(community.name);
      setDescription(community.description);
    });
  }, [community]);

  useEffect(() => {
    void Promise.resolve().then(fetchMembers);
  }, [fetchMembers]);

  useEffect(() => {
    if (community?.roomID) {
      void Promise.resolve().then(() => fetchMessages(community.roomID));
    }
  }, [community?.roomID, fetchMessages]);

  const handleDeleteMessage = async (message: Message) => {
    if (!window.confirm('このメッセージを削除しますか？')) return;
    try {
      await adminDeleteMessage(message.roomID, message.ID);
      setMessages((prev) => prev.filter((m) => m.ID !== message.ID));
    } catch {
      setError('メッセージの削除に失敗しました');
    }
  };

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

  if (!community) return <p>読み込み中...</p>;

  return (
    <div>
      <AdminHeader />
      <main className={styles.page}>
        <button onClick={() => navigate('/admin/communities')}><ChevronLeft /> 一覧に戻る</button>
        <h1>コミュニティ詳細</h1>

        {error && <p className={styles.errorText}>{error}</p>}
        {success && <p className={styles.successText}>{success}</p>}

        <h2>コミュニティ情報の編集</h2>
        <form
          onSubmit={handleUpdateSubmit}
          className={styles.formColumn}
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
              className={styles.fullWidth}
            />
          </div>
          <button type="submit">保存</button>
        </form>

        <hr className={styles.divider} />

        <h2>メンバー一覧</h2>
        {membersError && <p className={styles.errorText}>{membersError}</p>}
        {members.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ユーザーID</th>
                <th>名前</th>
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
                  <td>
                    <span className={`${styles.roleBadge} ${member.role === ROLE_OWNER ? styles.roleBadgeOwner : styles.roleBadgeMember}`}>
                      {member.role === ROLE_OWNER ? 'オーナー' : 'メンバー'}
                    </span>
                  </td>
                  <td className={styles.roleActions}>
                    <button
                      onClick={() => handleToggleRole(member)}
                      className={member.role === ROLE_OWNER ? styles.ownerAction : styles.memberAction}
                    >
                      {member.role === ROLE_OWNER ? '降格' : '昇格'}
                    </button>
                    <button
                      onClick={() => handleKick(member)}
                      className={styles.dangerButton}
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
        {memberTotal > memberPageSize && (
          <div className={styles.pagination}>
            <button disabled={memberOffset === 0} onClick={() => setMemberOffset(Math.max(0, memberOffset - memberPageSize))}>前へ</button>
            <span>{Math.floor(memberOffset / memberPageSize) + 1} / {Math.ceil(memberTotal / memberPageSize)}</span>
            <button disabled={memberOffset + memberPageSize >= memberTotal} onClick={() => setMemberOffset(memberOffset + memberPageSize)}>次へ</button>
          </div>
        )}

        <hr className={styles.divider} />

        <h2>メッセージ一覧</h2>
        {messagesError && <p className={styles.errorText}>{messagesError}</p>}
        {/* items は古い順なので、古いぶんを継ぎ足すボタンは表の手前に置く。 */}
        {hasOlderMessages && (
          <button
            type="button"
            onClick={loadOlderMessages}
            disabled={loadingOlderMessages}
            className={styles.paginationButton}
          >
            {loadingOlderMessages ? '読み込み中...' : '過去のメッセージを読み込む'}
          </button>
        )}
        {messages.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>投稿者</th>
                <th className={styles.tableHeader}>内容</th>
                <th className={styles.tableHeader}>投稿日時</th>
                <th className={styles.tableHeader}>操作</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message.ID}>
                  <td className={styles.tableCell}>
                    {message.user.name}
                    <span className={styles.accountId}>
                      @{message.user.accountID}
                    </span>
                  </td>
                  <td className={`${styles.tableCell} ${styles.contentCell}`}>
                    {message.content && <div>{message.content}</div>}
                    {message.media && message.media.length > 0 && (
                      <div className={`${styles.mediaList} ${message.content ? styles.mediaListSpaced : ''}`}>
                        {message.media.map((m) =>
                          m.contentType.startsWith('image/') ? (
                            <a key={m.ID} href={storageUrl(m.url)} target="_blank" rel="noopener noreferrer">
                              <img
                                src={storageUrl(m.url)}
                                alt="添付画像"
                                className={styles.mediaThumb}
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
                  <td className={`${styles.tableCell} ${styles.nowrap}`}>
                    {new Date(message.createdAt).toLocaleString('ja-JP')}
                  </td>
                  <td className={styles.tableCell}>
                    <button onClick={() => handleDeleteMessage(message)} className={styles.dangerButton}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !messagesError && <p>メッセージはありません</p>
        )}
      </main>
    </div>
  );
};
