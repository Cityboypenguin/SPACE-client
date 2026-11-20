import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { CommunityInvitationDetails } from '../components/molecules/CommunityInvitationDetails';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { useAuth } from '../context/useAuth';
import { receivedInvitations, type InvitationReference } from '../api/communityInvitations';
import { individualInvitationPath, RECEIVED_INVITATIONS } from '../lib/communityInvitationLinks';
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

export const CommunityInvitationPage = ({ shared = false }: { shared?: boolean }) => {
  const { id } = useParams<{ id: string }>();
  const { hash } = useLocation();
  const rawToken = hash.slice(1);
  const input: InvitationReference | null = shared
    ? (/^[A-Za-z0-9_-]{43}$/.test(rawToken) ? { token: rawToken } : null)
    : (id ? { id } : null);

  return (
    <div>
      <UserSidebar />
      <main className={styles.page}>
        <Link className={styles.backLink} to={RECEIVED_INVITATIONS}>届いた招待に戻る</Link>
        <h1>コミュニティへの招待</h1>
        <CommunityInvitationDetails key={shared ? rawToken : id} input={input} returnTo={RECEIVED_INVITATIONS} />
      </main>
    </div>
  );
};
