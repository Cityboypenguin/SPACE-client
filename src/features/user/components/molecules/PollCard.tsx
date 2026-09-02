import { useEffect, useMemo, useState } from 'react';
import { type Poll } from '../../api/poll';
import { BarChartIcon } from '../../../../components/atoms/BarChartIcon';
import styles from '../PollBox.module.css';

type Props = {
  poll: Poll;
  roomWritable: boolean;
  subscribePollUpdates: (pollID: string) => () => void;
  onVote: (pollID: string, optionIDs: string[]) => Promise<void>;
  onDelete: (pollID: string) => Promise<void>;
};

const votedOptionIDs = (poll: Poll) => poll.options.filter((o) => o.votedByMe).map((o) => o.ID);

// 回答期限は同日なら時刻のみ、別日ならChatDateSeparatorと同じ「M/D」形式を前置して表示する。
const formatDeadline = (deadline: string) => {
  const d = new Date(deadline);
  const now = new Date();
  const time = d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  const isSameDay = d.toDateString() === now.toDateString();
  return isSameDay ? time : `${d.getMonth() + 1}/${d.getDate()} ${time}`;
};

export const PollCard = ({ poll, roomWritable, subscribePollUpdates, onVote, onDelete }: Props) => {
  const [selected, setSelected] = useState<string[]>(() => votedOptionIDs(poll));
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  // 回答期限が無い投票は従来どおり常に結果を表示・常に投票可能。期限がある投票は、
  // 期限を過ぎるまで結果を隠して選択肢だけを見せる(ブラインド投票)。期限到達時に
  // 再レンダーして自動的に結果表示へ切り替えるため、現在時刻はstateに持つ。
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!poll.deadline) return;
    const msUntilDeadline = new Date(poll.deadline).getTime() - Date.now();
    if (msUntilDeadline <= 0) return;
    const timer = setTimeout(() => setNow(Date.now()), msUntilDeadline + 250);
    return () => clearTimeout(timer);
  }, [poll.deadline]);

  const isExpired = poll.deadline != null && new Date(poll.deadline).getTime() <= now;
  // 自分が投票済みなら、期限前でもその場で結果を表示する(未投票の他ユーザーには
  // 引き続き選択肢だけを見せてブラインドを保つ)。
  const hasVoted = poll.options.some((o) => o.votedByMe);
  const showResults = poll.deadline == null || isExpired || hasVoted;
  const canVote = roomWritable && !isExpired;
  const isTeacherPoll = poll.user.role === 'teacher';

  const leadingOptionID = useMemo(() => {
    if (totalVotes === 0) return null;
    return poll.options.reduce((a, b) => (b.voteCount > a.voteCount ? b : a)).ID;
  }, [poll.options, totalVotes]);

  // 選択肢を押した瞬間に投票を確定する(送信ボタンは無し)。複数選択可の投票では
  // 選択済みの選択肢をもう一度押すと選択解除として再送信する。
  const selectOption = async (optionID: string) => {
    if (!canVote || voting) return;
    const next = poll.allowMultipleChoice
      ? (selected.includes(optionID) ? selected.filter((id) => id !== optionID) : [...selected, optionID])
      : [optionID];
    setSelected(next);
    setVoting(true);
    setError('');
    try {
      await onVote(poll.ID, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '投票に失敗しました。');
      setSelected(votedOptionIDs(poll));
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (deleting || !window.confirm('この投票を削除しますか?')) return;
    setDeleting(true);
    setError('');
    try {
      await onDelete(poll.ID);
    } catch (err) {
      setError(err instanceof Error ? err.message : '投票の削除に失敗しました。');
      setDeleting(false);
    }
  };

  return (
    <div className={`${styles.card} ${isTeacherPoll ? styles.cardTeacher : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.questionRow}>
          <span className={styles.questionIcon}><BarChartIcon size={16} /></span>
          <p className={styles.question}>{poll.question}</p>
          {poll.allowMultipleChoice && <span className={styles.multiTag}>複数選択可</span>}
        </div>
        <div className={styles.metaColumn}>
          {poll.deadline != null && (
            <span className={styles.deadlineText}>
              {isExpired ? '回答終了' : `回答期限 ${formatDeadline(poll.deadline)}`}
            </span>
          )}
          {isTeacherPoll && <span className={styles.teacherTag}>先生からの投票</span>}
          {poll.isMine && (
            <button type="button" className={styles.deleteLink} disabled={deleting} onClick={handleDelete}>
              削除する
            </button>
          )}
        </div>
      </div>

      <div className={styles.options}>
        {poll.options.map((option) => {
          const percent = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
          const isSelected = selected.includes(option.ID);

          if (!showResults) {
            return (
              <button
                key={option.ID}
                type="button"
                className={`${styles.optionPlain} ${isSelected ? styles.optionPlainSelected : ''}`}
                disabled={!canVote || voting}
                onClick={() => selectOption(option.ID)}
                style={{ cursor: canVote ? 'pointer' : 'default' }}
              >
                {option.label}
              </button>
            );
          }

          const isLeading = leadingOptionID === option.ID && totalVotes > 0;
          return (
            <button
              key={option.ID}
              type="button"
              className={`${styles.optionBar} ${isLeading ? styles.optionBarLeading : ''} ${isSelected ? styles.optionBarSelected : ''}`}
              disabled={!canVote || voting}
              onClick={() => selectOption(option.ID)}
              style={{ cursor: canVote ? 'pointer' : 'default' }}
            >
              <div className={styles.optionBarFill} style={{ width: `${percent}%` }} />
              <span className={styles.optionBarLabel}>{option.label}</span>
              <span className={styles.optionBarPercent}>{percent}%</span>
            </button>
          );
        })}
      </div>

      <p className={styles.respondedCount}>{totalVotes}人が回答済み</p>

      {error && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '0.3rem 0 0' }}>{error}</p>}
    </div>
  );
};
