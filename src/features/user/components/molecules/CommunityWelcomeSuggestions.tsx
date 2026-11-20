import { useState } from 'react';
import type { getCommunityGreeting } from '../../api/communityInvitations';
import { storageUrl } from '../../../../lib/storage';
import styles from '../../pages/CommunityRoomPage.module.css';

type Greeting = NonNullable<Awaited<ReturnType<typeof getCommunityGreeting>>>;

export const CommunityWelcomeSuggestions = ({
  greeting, onSend,
}: {
  greeting: Greeting;
  onSend: (stampID: string) => Promise<void>;
}) => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const send = async (stampID: string) => {
    if (sending) return;
    setSending(true);
    setError('');
    try {
      await onSend(stampID);
    } catch (err) {
      setError(err instanceof Error ? err.message : '歓迎スタンプを送れませんでした。');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.welcomePanel} role="group" aria-label={`${greeting.joinedUserName}さんを歓迎しましょう！`}>
      <p className={styles.welcomeHeading}>{greeting.joinedUserName}さんを歓迎しましょう！</p>
      <div className={styles.welcomeOptions}>
        {greeting.stamps.map((stamp) => (
          <button key={stamp.id} type="button" disabled={sending}
            onClick={() => void send(stamp.id)} aria-label={`${stamp.label}を送る`}>
            {stamp.imageUrl
              ? <img src={storageUrl(stamp.imageUrl)} alt="" title={stamp.label} />
              : stamp.label}
          </button>
        ))}
      </div>
      {error && <p className={styles.errorText} role="alert">{error}</p>}
    </div>
  );
};
