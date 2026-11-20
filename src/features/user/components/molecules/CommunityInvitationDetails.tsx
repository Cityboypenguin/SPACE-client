import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { useAuth } from '../../context/useAuth';
import { acceptInvitation, declineInvitation, previewInvitation, type InvitationReference } from '../../api/communityInvitations';
import { receivedInvitationCountKey } from '../../lib/communityInvitationLinks';
import { toUserMessage } from '../../../../lib/errorMessages';
import { CommunityAvatar } from '../../../../components/atoms/CommunityAvatar';
import { InvitationExpiry } from './InvitationExpiry';
import styles from '../../pages/CommunityInvitationsPage.module.css';

const statusText: Record<string, string> = {
  expired: 'この招待の有効期限が切れました。',
  revoked: 'この招待は利用できません。',
  declined: 'この招待を辞退しました。',
  accepted: 'この招待は対応済みです。',
};

export const CommunityInvitationDetails = ({ input, returnTo, showSender = true }: {
  input: InvitationReference | null;
  returnTo: string;
  showSender?: boolean;
}) => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { mutate } = useSWRConfig();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const key = input ? ('id' in input ? input.id : input.token) : null;
  const { data, error, isLoading, mutate: refresh } = useSWR(
    key && userId ? ['community-invitation', userId, key] : null,
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
      } else if ('id' in input) {
        await declineInvitation(input.id);
        if (userId) void mutate(receivedInvitationCountKey(userId));
        navigate(returnTo, { replace: true });
      }
    } catch (err) {
      setActionError(toUserMessage(err, '招待を処理できませんでした。'));
      void refresh();
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {isLoading && <div className={styles.skeleton} style={{ height: '18rem' }} aria-busy="true" aria-label="読み込み中" />}
      {(error || !input) && <p className={styles.alert} role="alert">この招待は利用できません。</p>}
      {data && (
        <section className={styles.card}>
          <CommunityAvatar name={data.communityName} src={data.communityAvatarURL} size={88} />
          <h2>{data.communityName}</h2>
          <div className={styles.cardMeta}>
            <span>メンバー {data.memberCount}人</span>
            {data.status === 'pending' && !data.isMember && <InvitationExpiry expiresAt={data.expiresAt} />}
          </div>
          {showSender && data.senderName && <p className={styles.invitedBy}>{data.senderName}さんからの招待</p>}
          {data.message && (
            <figure className={styles.messageQuote}>
              <blockquote>{data.message}</blockquote>
              {data.senderName && <figcaption>— {data.senderName}さん</figcaption>}
            </figure>
          )}
          {data.communityDescription && <p className={styles.description}>{data.communityDescription}</p>}
          {data.isMember && <p className={styles.statusMessage}>すでにこのコミュニティに参加しています。</p>}
          {data.status !== 'pending' && !data.isMember && <p className={styles.statusMessage}>{statusText[data.status]}</p>}
          <div className={styles.actions}>
            {input && 'id' in input && !data.isMember && data.status === 'pending' && (
              <button type="button" className={styles.secondaryButton} onClick={() => void respond(false)} disabled={busy}>辞退する</button>
            )}
            {(data.isMember || data.status === 'pending') && (
              <button type="button" className={styles.primaryButton} onClick={() => void respond(true)} disabled={busy}>
                {data.isMember ? 'チャットを開く' : '参加する'}
              </button>
            )}
          </div>
          {actionError && <p className={styles.alert} role="alert">{actionError}</p>}
        </section>
      )}
    </>
  );
};
