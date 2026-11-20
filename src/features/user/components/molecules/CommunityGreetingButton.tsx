import { useState } from 'react';
import type { getCommunityGreeting } from '../../api/communityInvitations';
import { storageUrl } from '../../../../lib/storage';
import styles from '../../pages/CommunityRoomPage.module.css';

type Greeting = NonNullable<Awaited<ReturnType<typeof getCommunityGreeting>>>;

export const CommunityGreetingButton = ({
  greeting, onSend,
}: {
  greeting: Greeting;
  onSend: (stampID: string) => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const send = async (id: string) => {
    if (sending) return;
    setSending(true);
    setError('');
    try {
      await onSend(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '挨拶を送れませんでした。');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.greeting}>
      <button type="button" disabled={sending}
        aria-expanded={greeting.stamps.length > 1 ? open : undefined}
        onClick={() => {
          if (greeting.stamps.length === 1) void send(greeting.stamps[0].id);
          else setOpen(!open);
        }}>
        👋 よろしく！
      </button>
      {open && (
        <div className={styles.greetingOptions} role="group" aria-label="送るスタンプを選ぶ">
          {greeting.stamps.map((stamp) => (
            <button key={stamp.id} type="button" disabled={sending}
              onClick={() => void send(stamp.id)} aria-label={`${stamp.label}を送る`}>
              {stamp.imageUrl
                ? <img src={storageUrl(stamp.imageUrl)} alt="" title={stamp.label} />
                : stamp.label}
            </button>
          ))}
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
};
