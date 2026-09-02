import { type useCoursePolls } from '../../hooks/useCoursePolls';
import { createPoll, votePoll, deletePoll } from '../../api/poll';
import { CreatePollForm } from '../molecules/CreatePollForm';
import { PollCard } from '../molecules/PollCard';
import styles from '../PollBox.module.css';

type Props = {
  roomId: string;
  roomWritable: boolean;
  pollsState: ReturnType<typeof useCoursePolls>;
};

export const PollList = ({ roomId, roomWritable, pollsState }: Props) => {
  const {
    polls, loading, error, hasMore, loadingMore, loadMore,
    subscribePollUpdates, addPoll, updatePoll, removePoll,
  } = pollsState;

  const handleCreate = async (question: string, options: string[], allowMultipleChoice: boolean, deadline?: string) => {
    const created = await createPoll(roomId, question, options, allowMultipleChoice, deadline);
    addPoll(created);
  };

  const handleVote = async (pollID: string, optionIDs: string[]) => {
    const updated = await votePoll(pollID, optionIDs);
    updatePoll(updated);
  };

  const handleDelete = async (pollID: string) => {
    await deletePoll(pollID);
    removePoll(pollID);
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
          onDelete={handleDelete}
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
