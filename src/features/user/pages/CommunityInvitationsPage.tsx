import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { CommunityAvatar } from '../../../components/atoms/CommunityAvatar';
import { CommunityInvitationDetails } from '../components/molecules/CommunityInvitationDetails';
import { InvitationExpiry } from '../components/molecules/InvitationExpiry';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { useAuth } from '../context/useAuth';
import { acceptInvitation, declineInvitation, receivedInvitations, type InvitationReference } from '../api/communityInvitations';
import { individualInvitationPath, RECEIVED_INVITATIONS, receivedInvitationCountKey } from '../lib/communityInvitationLinks';
import { toUserMessage } from '../../../lib/errorMessages';
import { AppSwal } from '../../../lib/swal';
import styles from './CommunityInvitationsPage.module.css';

const pageSize = 20;

export const CommunityInvitationsPage = () => {
  const [page, setPage] = useState(0);
  const { userId } = useAuth();
  // 招待は他の人の操作で増えたり消えたりするので、画面に戻るたびに取り直す。
  const navigate = useNavigate();
  const { mutate: globalMutate } = useSWRConfig();
  const [busyID, setBusyID] = useState('');
  const [actionError, setActionError] = useState('');
  // 招待は他の人の操作で増えたり消えたりする。画面に戻ったときに加え、サーバーからの
  // community_invitations_changed（refreshInvitationCaches）でもその場で取り直す。
  const { data, error, isLoading, mutate } = useSWR(
    userId ? ['received-invitations', userId, page] : null,
    () => receivedInvitations(pageSize, page * pageSize),
    { revalidateOnFocus: true, keepPreviousData: true },
  );

  const respond = async (id: string, communityName: string, accept: boolean) => {
    if (busyID) return;
    if (!accept) {
      const result = await AppSwal.fire({
        text: `${communityName}への招待を辞退しますか？`,
        confirmButtonText: '辞退する',
        cancelButtonText: 'やめる',
        showCancelButton: true,
      });
      if (!result.isConfirmed) return;
    }
    setBusyID(id);
    setActionError('');
    try {
      if (accept) {
        const room = await acceptInvitation({ id });
        await globalMutate('my-communities', undefined, { revalidate: false });
        navigate(`/community/chat/${room}`);
      } else {
        await declineInvitation(id);
        await mutate();
      }
      if (userId) void globalMutate(receivedInvitationCountKey(userId));
    } catch (err) {
      setActionError(toUserMessage(err, '招待を処理できませんでした。'));
      void mutate();
    } finally {
      setBusyID('');
    }
  };
  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div>
      <UserSidebar />
      <main className={styles.page}>
        <Link className={styles.backLink} to="/community">
          <ChevronLeft size={7} />コミュニティに戻る
        </Link>
        <div className={styles.header}>
          <h1>届いた招待</h1>
          {!!data?.total && <span className={styles.countBadge}>{data.total}</span>}
        </div>
        {!!data?.total && <p className={styles.lead}>その場で参加できます。カードを開くと紹介文を読んでから決められます。</p>}

        {isLoading && !data && (
          <div className={styles.list} aria-busy="true" aria-label="読み込み中">
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </div>
        )}
        {error && <p className={styles.alert} role="alert">招待一覧を読み込めませんでした。</p>}
        {actionError && <p className={styles.alert} role="alert">{actionError}</p>}
        {data?.total === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true">✉️</span>
            <p className={styles.emptyTitle}>参加できる招待はありません。</p>
            <p className={styles.muted}>招待が届くと、ここと通知に表示されます。</p>
            <Link className={styles.secondaryButton} to="/community">コミュニティを探す</Link>
          </div>
        )}

        <ul className={styles.list}>
          {data?.items.map((invite) => (
            <li key={invite.id} className={styles.inviteItem}>
              <Link className={styles.inviteCard} to={individualInvitationPath(invite.id)}>
                <CommunityAvatar name={invite.communityName} src={invite.communityAvatarURL} size={52} />
                <span className={styles.inviteBody}>
                  <strong className={styles.inviteName}>{invite.communityName}</strong>
                  <span className={styles.inviteMeta}>
                    {invite.senderName && <span>{invite.senderName}さんから</span>}
                    <span>メンバー {invite.memberCount}人</span>
                  </span>
                  {invite.message ? (
                    <span className={styles.inviteMessage}>「{invite.message}」</span>
                  ) : invite.communityDescription && (
                    <span className={styles.inviteDescription}>{invite.communityDescription}</span>
                  )}
                </span>
                <span className={styles.inviteAside}>
                  <InvitationExpiry expiresAt={invite.expiresAt} />
                  <span className={styles.chevron}><ChevronLeft size={8} /></span>
                </span>
              </Link>
              <div className={styles.inviteActions}>
                <button type="button" className={styles.ghostButton} disabled={!!busyID}
                  aria-label={`${invite.communityName}への招待を辞退する`}
                  onClick={() => void respond(invite.id, invite.communityName, false)}>
                  辞退
                </button>
                <button type="button" className={styles.primaryButton} disabled={!!busyID}
                  aria-label={`${invite.communityName}に参加する`}
                  onClick={() => void respond(invite.id, invite.communityName, true)}>
                  {busyID === invite.id ? '処理中…' : '参加する'}
                </button>
              </div>
            </li>
          ))}
        </ul>

        {totalPages > 1 && (
          <nav className={styles.pagination} aria-label="ページ">
            <button type="button" className={styles.secondaryButton} disabled={page === 0} onClick={() => setPage(page - 1)}>
              前へ
            </button>
            <span>{page + 1} / {totalPages}</span>
            <button type="button" className={styles.secondaryButton} disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>
              次へ
            </button>
          </nav>
        )}
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
        <Link className={styles.backLink} to={RECEIVED_INVITATIONS}>
          <ChevronLeft size={7} />届いた招待に戻る
        </Link>
        <div className={styles.header}>
          <h1>コミュニティへの招待</h1>
        </div>
        <CommunityInvitationDetails key={shared ? rawToken : id} input={input} returnTo={RECEIVED_INVITATIONS} />
      </main>
    </div>
  );
};
