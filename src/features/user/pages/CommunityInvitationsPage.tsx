import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { useAuth } from '../context/useAuth';
import { acceptInvitation, declineInvitation, previewInvitation, receivedInvitations, type InvitationReference } from '../api/communityInvitations';
import { individualInvitationPath, RECEIVED_INVITATIONS, receivedInvitationCountKey } from '../lib/communityInvitationLinks';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from './CommunityInvitationsPage.module.css';

const pageSize = 20;

export const CommunityInvitationsPage = () => {
  const [page, setPage] = useState(0);
  const { userId } = useAuth();
  const { data, error, isLoading } = useSWR(
    userId ? ['received-invitations', userId, page] : null,
    () => receivedInvitations(pageSize, page * pageSize),
  );
  return (
    <div>
      <UserSidebar />
      <main className={styles.page}>
        <Link to="/community">コミュニティに戻る</Link>
        <h1>届いた招待</h1>
        {isLoading && <p>読み込み中…</p>}
        {error && <p role="alert">招待一覧を読み込めませんでした。</p>}
        {data?.total === 0 && <p>参加できる招待はありません。</p>}
        <ul className={styles.list}>
          {data?.items.map((invite) => (
            <li key={invite.id}>
              <Link to={individualInvitationPath(invite.id)}>
                <strong>{invite.communityName}</strong>
                {invite.senderName && <span>{invite.senderName}さんから</span>}
              </Link>
            </li>
          ))}
        </ul>
        {page > 0 && <button type="button" onClick={() => setPage(page - 1)}>前へ</button>}
        {data && data.total > (page + 1) * pageSize && <button type="button" onClick={() => setPage(page + 1)}>次へ</button>}
      </main>
    </div>
  );
};

const statusText: Record<string, string> = {
  expired: 'この招待の有効期限が切れました。',
  revoked: 'この招待は利用できません。',
  declined: 'この招待を辞退しました。',
  accepted: 'この招待は対応済みです。',
};

export const CommunityInvitationPage = ({ shared = false }: { shared?: boolean }) => {
  const { id } = useParams<{ id: string }>();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { mutate } = useSWRConfig();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const rawToken = hash.slice(1);
  const input: InvitationReference | null = shared
    ? (/^[A-Za-z0-9_-]{43}$/.test(rawToken) ? { token: rawToken } : null)
    : (id ? { id } : null);
  const { data, error, isLoading, mutate: refresh } = useSWR(
    input && userId ? ['community-invitation', userId, shared ? rawToken : id] : null,
    () => previewInvitation(input!),
  );
  const respond = async (accept: boolean) => {
    if (!input || busy) return;
    if (accept && data?.isMember) {
      navigate(`/community/chat/${data.roomID}`, { replace: true });
      return;
    }
    setBusy(true);
    setActionError('');
    try {
      if (accept) {
        const room = await acceptInvitation(input);
        if (userId) void mutate(receivedInvitationCountKey(userId));
        await mutate('my-communities', undefined, { revalidate: false });
        navigate(`/community/chat/${room}`, { replace: true });
      } else if (id) {
        await declineInvitation(id);
        if (userId) void mutate(receivedInvitationCountKey(userId));
        navigate(RECEIVED_INVITATIONS, { replace: true });
      }
    } catch (err) {
      setActionError(toUserMessage(err, '招待を処理できませんでした。'));
      void refresh();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <UserSidebar />
      <main className={styles.page}>
        <Link to={RECEIVED_INVITATIONS}>届いた招待に戻る</Link>
        <h1>コミュニティへの招待</h1>
        {isLoading && <p>読み込み中…</p>}
        {(error || !input) && <p role="alert">この招待は利用できません。</p>}
        {data && (
          <section className={styles.card}>
            <h2>{data.communityName}</h2>
            {data.senderName && <p>{data.senderName}さんからの招待</p>}
            <p className={styles.description}>{data.communityDescription}</p>
            {data.status === 'pending' && <p>有効期限 {new Date(data.expiresAt).toLocaleString('ja-JP')}</p>}
            {data.status !== 'pending' && !data.isMember && <p>{statusText[data.status]}</p>}
            <div className={styles.actions}>
              {(data.isMember || data.status === 'pending') && (
                <button type="button" onClick={() => void respond(true)} disabled={busy}>
                  {data.isMember ? 'チャットを開く' : '参加する'}
                </button>
              )}
              {!shared && !data.isMember && data.status === 'pending' && (
                <button type="button" onClick={() => void respond(false)} disabled={busy}>辞退する</button>
              )}
            </div>
            {actionError && <p role="alert">{actionError}</p>}
          </section>
        )}
      </main>
    </div>
  );
};
