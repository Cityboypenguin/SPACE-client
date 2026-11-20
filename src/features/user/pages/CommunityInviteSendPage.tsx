import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { useAuth } from '../context/useAuth';
import { searchUsers, type UserProfile } from '../api/profile';
import { createInvitationLink, inviteCommunityUser, revokeInvitation, sentInvitations } from '../api/communityInvitations';
import { sharedInvitationPath } from '../lib/communityInvitationLinks';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from './CommunityInvitationsPage.module.css';

const pageSize = 20;

export const CommunityInviteSendPage = () => {
  const { communityID, roomID } = useParams<{ communityID: string; roomID: string }>();
  const { userId } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[] | null>(null);
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const [linkID, setLinkID] = useState('');
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const { data: sent, error: sentError, isLoading, mutate } = useSWR(
    userId && roomID ? ['sent-community-invitations', userId, roomID, page] : null,
    () => sentInvitations(roomID!, pageSize + 1, page * pageSize),
  );

  const run = async (action: () => Promise<void>, fallback: string) => {
    if (busy) return;
    setBusy(true);
    setNotice('');
    setError('');
    try {
      await action();
    } catch (err) {
      setError(toUserMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const search = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    void run(async () => {
      setResults(null);
      const { items } = await searchUsers(query.trim());
      setResults(items.filter((item) => item.ID !== userId));
    }, 'ユーザーを検索できませんでした。');
  };

  const send = (user: UserProfile) => {
    if (!communityID) return;
    void run(async () => {
      await inviteCommunityUser(communityID, user.ID);
      setNotice(`${user.name}さんに招待を送りました。`);
      if (page === 0) void mutate();
      else setPage(0);
    }, '招待を送れませんでした。');
  };

  const create = () => {
    if (!communityID) return;
    void run(async () => {
      const data = await createInvitationLink(communityID);
      setLink({ url: new URL(sharedInvitationPath(data.token), window.location.origin).href, expiresAt: data.invitation.expiresAt });
      setLinkID(data.invitation.id);
      if (page === 0) void mutate();
      else setPage(0);
    }, '招待リンクを作成できませんでした。');
  };

  const revoke = (id: string) => {
    void run(async () => {
      await revokeInvitation(id);
      if (id === linkID) setLink(null);
      setNotice('招待を取り消しました。');
      await mutate();
    }, '招待を取り消せませんでした。');
  };

  const copy = () => {
    if (!link) return;
    void run(async () => {
      await navigator.clipboard.writeText(link.url);
      setNotice('リンクをコピーしました。');
    }, 'リンクをコピーできませんでした。表示されたURLを選択してコピーしてください。');
  };

  return (
    <div>
      <UserSidebar />
      <main className={styles.page}>
        <Link to={roomID ? `/community/chat/${roomID}` : '/community'} state={{ showDetail: true }}>
          コミュニティに戻る
        </Link>
        <h1>メンバーを招待する</h1>
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert">{error}</p>}
        <section>
          <h2>ユーザーを検索して招待</h2>
          <form onSubmit={search} className={styles.actions}>
            <input type="search" aria-label="名前またはアカウントID" placeholder="名前またはアカウントID"
              value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="submit" disabled={busy || !query.trim()}>検索</button>
          </form>
          {results?.length === 0 && <p>該当するユーザーが見つかりませんでした。</p>}
          <ul className={styles.list}>
            {results?.map((user) => (
              <li key={user.ID} className={styles.inviteRow}>
                <span>{user.name} <small>@{user.accountID}</small></span>
                <button type="button" onClick={() => send(user)} disabled={busy}>招待する</button>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>招待リンクを作成</h2>
          <button type="button" onClick={create} disabled={busy}>リンクを作成する</button>
          {link && (
            <div className={styles.linkBox}>
              <input type="text" aria-label="発行した招待リンク" value={link.url} readOnly
                onFocus={(e) => e.target.select()} />
              <button type="button" onClick={copy} disabled={busy}>コピー</button>
              <p>有効期限 {new Date(link.expiresAt).toLocaleString('ja-JP')}</p>
            </div>
          )}
        </section>
        <section>
          <h2>有効な招待</h2>
          {isLoading && <p>読み込み中…</p>}
          {sentError && <p role="alert">招待を読み込めませんでした。</p>}
          {sent?.length === 0 && <p>有効な招待はありません。</p>}
          <ul className={styles.list}>
            {sent?.slice(0, pageSize).map((invite) => (
              <li key={invite.id} className={styles.inviteRow}>
                <span>
                  {invite.isLink ? '招待リンク' : (invite.recipientName ?? 'ユーザーへの招待')}
                  {invite.senderName && <small> · {invite.senderName}さんが作成</small>}
                  <small> · {new Date(invite.expiresAt).toLocaleString('ja-JP')}まで</small>
                </span>
                <button type="button" onClick={() => revoke(invite.id)} disabled={busy}>取り消す</button>
              </li>
            ))}
          </ul>
          {page > 0 && <button type="button" onClick={() => setPage(page - 1)}>前へ</button>}
          {sent && sent.length > pageSize && <button type="button" onClick={() => setPage(page + 1)}>次へ</button>}
        </section>
      </main>
    </div>
  );
};
