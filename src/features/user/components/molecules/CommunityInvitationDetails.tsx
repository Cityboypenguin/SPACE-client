import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { useAuth } from '../../context/useAuth';
import { acceptInvitation, declineInvitation, previewInvitation, type InvitationReference } from '../../api/communityInvitations';
import { receivedInvitationCountKey } from '../../lib/communityInvitationLinks';
import { toUserMessage } from '../../../../lib/errorMessages';
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
      {isLoading && <p>読み込み中…</p>}
      {(error || !input) && <p role="alert">この招待は利用できません。</p>}
      {data && (
        <section className={styles.card}>
          <h2>{data.communityName}</h2>
          {showSender && data.senderName && <p>{data.senderName}さんからの招待</p>}
          <p className={styles.description}>{data.communityDescription}</p>
          {data.status === 'pending' && <p>有効期限 {new Date(data.expiresAt).toLocaleString('ja-JP')}</p>}
          {data.status !== 'pending' && !data.isMember && <p>{statusText[data.status]}</p>}
          <div className={styles.actions}>
            {(data.isMember || data.status === 'pending') && (
              <button type="button" onClick={() => void respond(true)} disabled={busy}>
                {data.isMember ? 'チャットを開く' : '参加する'}
              </button>
            )}
            {input && 'id' in input && !data.isMember && data.status === 'pending' && (
              <button type="button" onClick={() => void respond(false)} disabled={busy}>辞退する</button>
            )}
          </div>
          {actionError && <p role="alert">{actionError}</p>}
        </section>
      )}
    </>
  );
};
