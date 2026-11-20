import { useState } from 'react';
import { storageUrl } from '../../../../lib/storage';
import styles from '../../pages/CommunityRoomPage.module.css';

type Stamp = { id: string; label: string; imageUrl?: string | null };

// チャット欄の下に出す、ワンクリックでスタンプを送るパネル。
// 既存メンバーが新しい人を歓迎するときと、参加した本人があいさつするときの両方で使う。
export const CommunityWelcomeSuggestions = ({
  icon, heading, hint, stamps, onSend, onSkip,
}: {
  /** 見出しの前に出す絵文字。 */
  icon: string;
  heading: string;
  /** 見出しの下に添える一言。 */
  hint: string;
  stamps: Stamp[];
  onSend: (stampID: string) => Promise<void>;
  /** 渡すと「あとで」ボタンを出す。 */
  onSkip?: () => Promise<void>;
}) => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const run = async (action: () => Promise<void>) => {
    if (sending) return;
    setSending(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スタンプを送れませんでした。');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.welcomePanel} role="group" aria-label={`${heading}${hint}`}>
      <div className={styles.welcomeHeader}>
        <span className={styles.welcomeIcon} aria-hidden="true">{icon}</span>
        <div className={styles.welcomeText}>
          <p className={styles.welcomeHeading}>{heading}</p>
          <p className={styles.welcomeHint}>{hint}</p>
        </div>
        {onSkip && (
          <button type="button" className={styles.welcomeSkip} disabled={sending} onClick={() => void run(onSkip)}>
            あとで
          </button>
        )}
      </div>
      <div className={styles.welcomeOptions}>
        {stamps.map((stamp) => (
          <button key={stamp.id} type="button" disabled={sending}
            onClick={() => void run(() => onSend(stamp.id))} aria-label={`${stamp.label}を送る`}>
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
