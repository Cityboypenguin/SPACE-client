import { useCoursePolls } from '../../hooks/useCoursePolls';
import { createPoll, votePoll } from '../../api/poll';
import { CreatePollForm } from '../molecules/CreatePollForm';
import { PollCard } from '../molecules/PollCard';
import styles from '../PollBox.module.css';

type Props = {
  roomId: string;
  roomWritable: boolean;
};

export const PollList = ({ roomId, roomWritable }: Props) => {
  const {
    polls, loading, error, hasMore, loadingMore, loadMore,
    subscribePollUpdates, addPoll, updatePoll,
  } = useCoursePolls(roomId);

  const handleCreate = async (question: string, options: string[], allowMultipleChoice: boolean) => {
    const created = await createPoll(roomId, question, options, allowMultipleChoice);
    addPoll(created);
  };

  const handleVote = async (pollID: string, optionIDs: string[]) => {
    const updated = await votePoll(pollID, optionIDs);
    updatePoll(updated);
  };

  return (
    <div className={styles.tabContent}>
      {roomWritable && <CreatePollForm onCreate={handleCreate} />}

      {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}

      {!loading && polls.length === 0 && !error && (
        <p className={styles.emptyState}>まだ投票がありません。</p>
      )}

      {polls.map((poll) => (
        <PollCard
          key={poll.ID}
          poll={poll}
          roomWritable={roomWritable}
          subscribePollUpdates={subscribePollUpdates}
          onVote={handleVote}
        />
      ))}

      {hasMore && (
        <button type="button" className={styles.loadMoreButton} onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? '読み込み中...' : 'もっと見る'}
        </button>
      )}
    </div>
  );
};
