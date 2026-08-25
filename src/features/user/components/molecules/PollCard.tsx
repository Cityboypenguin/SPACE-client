import { useEffect, useState } from 'react';
import { type Poll } from '../../api/poll';
import styles from '../PollBox.module.css';

type Props = {
  poll: Poll;
  roomWritable: boolean;
  subscribePollUpdates: (pollID: string) => () => void;
  onVote: (pollID: string, optionIDs: string[]) => Promise<void>;
};

const votedOptionIDs = (poll: Poll) => poll.options.filter((o) => o.votedByMe).map((o) => o.ID);

export const PollCard = ({ poll, roomWritable, subscribePollUpdates, onVote }: Props) => {
  const [selected, setSelected] = useState<string[]>(() => votedOptionIDs(poll));
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');

  // サーバーから最新の投票結果(poll.options)が届いたら選択状態も同期する。
  // レンダー中に直接 setState することで、同期のためだけの useEffect を避ける
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)。
  const [prevOptions, setPrevOptions] = useState(poll.options);
  if (poll.options !== prevOptions) {
    setPrevOptions(poll.options);
    setSelected(votedOptionIDs(poll));
  }

  useEffect(() => {
    const unsubscribe = subscribePollUpdates(poll.ID);
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.ID]);

  const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);

  const toggleOption = (optionID: string) => {
    if (!roomWritable) return;
    if (poll.allowMultipleChoice) {
      setSelected((prev) => (prev.includes(optionID) ? prev.filter((id) => id !== optionID) : [...prev, optionID]));
    } else {
      setSelected([optionID]);
    }
  };

  const handleSubmit = async () => {
    if (selected.length === 0 || voting) return;
    setVoting(true);
    setError('');
    try {
      await onVote(poll.ID, selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : '投票に失敗しました。');
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.senderName}>{poll.user.name}</span>
        {poll.allowMultipleChoice && <span className={styles.multiTag}>複数選択可</span>}
      </div>

      <p className={styles.question}>{poll.question}</p>

      <div className={styles.options}>
        {poll.options.map((option) => {
          const percent = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
          const isSelected = selected.includes(option.ID);
          return (
            <label key={option.ID} className={styles.option} style={{ cursor: roomWritable ? 'pointer' : 'default' }}>
              <div className={styles.optionRow}>
                <input
                  type={poll.allowMultipleChoice ? 'checkbox' : 'radio'}
                  name={`poll-${poll.ID}`}
                  checked={isSelected}
                  disabled={!roomWritable}
                  onChange={() => toggleOption(option.ID)}
                />
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionPercent}>{percent}% ({option.voteCount})</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${option.votedByMe ? styles.barFillVoted : ''}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </label>
          );
        })}
      </div>

      <p className={styles.voteCount}>{totalVotes}票</p>

      {roomWritable && (
        <div className={styles.submitRow}>
          <button type="button" className={styles.submitButton} disabled={selected.length === 0 || voting} onClick={handleSubmit}>
            {voting ? '投票中...' : '投票する'}
          </button>
        </div>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '0.3rem 0 0' }}>{error}</p>}
    </div>
  );
};
