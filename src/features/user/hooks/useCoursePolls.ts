import { useCallback, useEffect, useRef, useState } from 'react';
import { listPolls, type Poll, type PollVoteUpdate, POLL_FIELDS } from '../api/poll';
import { subscribeToGraphQL } from '../../../lib/graphqlWs';
import { toUserMessage } from '../../../lib/errorMessages';

const POLL_ADDED_SUBSCRIPTION = `
  subscription PollAdded($roomID: ID!) {
    pollAdded(roomID: $roomID) {
      ${POLL_FIELDS}
    }
  }
`;

// 投票のたびに全閲覧者へ配信されるため、変わる options だけに絞り、変わらない
// user/question 等は再送しない。
const POLL_UPDATED_SUBSCRIPTION = `
  subscription PollUpdated($pollID: ID!) {
    pollUpdated(pollID: $pollID) {
      ID
      options {
        ID
        label
        voteCount
        votedByMe
      }
    }
  }
`;

const POLL_DELETED_SUBSCRIPTION = `
  subscription PollDeleted($roomID: ID!) {
    pollDeleted(roomID: $roomID) {
      ID
    }
  }
`;

type PollAddedData = { pollAdded: Poll };
type PollUpdatedData = { pollUpdated: PollVoteUpdate };
type PollDeletedData = { pollDeleted: Pick<Poll, 'ID'> };

const PAGE_SIZE = 50;
const isPollUnvoted = (poll: Pick<Poll, 'options'>) => poll.options.every((o) => !o.votedByMe);
const unvotedDelta = (before: Pick<Poll, 'options'>, after: Pick<Poll, 'options'>) => {
  const wasUnvoted = isPollUnvoted(before);
  const isUnvoted = isPollUnvoted(after);
  if (wasUnvoted === isUnvoted) return 0;
  return isUnvoted ? 1 : -1;
};

type State = {
  polls: Poll[];
  total: number;
  unvotedTotal: number;
  loading: boolean;
  error: string;
};

export const useCoursePolls = (roomId: string | undefined) => {
  const [state, setState] = useState<State>({ polls: [], total: 0, unvotedTotal: 0, loading: true, error: '' });
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    offsetRef.current = 0;
    setState({ polls: [], total: 0, unvotedTotal: 0, loading: true, error: '' });

    (async () => {
      try {
        const page = await listPolls(roomId, PAGE_SIZE, 0);
        if (!active) return;
        offsetRef.current = page.items.length;
        setState({ polls: page.items, total: page.total, unvotedTotal: page.unvotedTotal, loading: false, error: '' });
      } catch (err) {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: toUserMessage(err, '投票の読み込みに失敗しました。時間をおいてから再度お試しください。'),
        }));
      }
    })();

    return () => { active = false; };
  }, [roomId]);

  const loadMore = useCallback(async () => {
    if (!roomId || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listPolls(roomId, PAGE_SIZE, offsetRef.current);
      offsetRef.current += page.items.length;
      setState((prev) => ({
        ...prev,
        polls: [...prev.polls, ...page.items.filter((p) => !prev.polls.some((e) => e.ID === p.ID))],
        total: page.total,
        unvotedTotal: page.unvotedTotal,
      }));
    } finally {
      setLoadingMore(false);
    }
  }, [roomId, loadingMore]);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = subscribeToGraphQL<PollAddedData>(
      POLL_ADDED_SUBSCRIPTION,
      { roomID: roomId },
      (data) => {
        const p = data.pollAdded;
        if (!p) return;
        setState((prev) => {
          if (prev.polls.some((e) => e.ID === p.ID)) return prev;
          offsetRef.current += 1;
          return {
            ...prev,
            polls: [p, ...prev.polls],
            total: prev.total + 1,
            unvotedTotal: prev.unvotedTotal + (isPollUnvoted(p) ? 1 : 0),
          };
        });
      },
      (err) => console.error('[useCoursePolls] pollAdded subscription error:', err),
    );
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = subscribeToGraphQL<PollDeletedData>(
      POLL_DELETED_SUBSCRIPTION,
      { roomID: roomId },
      (data) => {
        const deletedID = data.pollDeleted?.ID;
        if (!deletedID) return;
        setState((prev) => {
          const deleted = prev.polls.find((e) => e.ID === deletedID);
          if (!deleted) return prev;
          offsetRef.current -= 1;
          return {
            ...prev,
            polls: prev.polls.filter((e) => e.ID !== deletedID),
            total: prev.total - 1,
            unvotedTotal: Math.max(0, prev.unvotedTotal - (isPollUnvoted(deleted) ? 1 : 0)),
          };
        });
      },
      (err) => console.error('[useCoursePolls] pollDeleted subscription error:', err),
    );
    return () => unsubscribe();
  }, [roomId]);

  // 投票結果の更新(pollUpdated)は pollID 単位のサブスクリプションのため、
  // 現在表示中の各投票ごとに個別購読する関数として公開する。
  const subscribePollUpdates = useCallback((pollID: string) => {
    return subscribeToGraphQL<PollUpdatedData>(
      POLL_UPDATED_SUBSCRIPTION,
      { pollID },
      (data) => {
        const p = data.pollUpdated;
        if (!p) return;
        setState((prev) => {
          const existing = prev.polls.find((e) => e.ID === p.ID);
          if (!existing) return prev;
          const next = { ...existing, ...p };
          return {
            ...prev,
            polls: prev.polls.map((e) => (e.ID === p.ID ? next : e)),
            unvotedTotal: prev.unvotedTotal + unvotedDelta(existing, next),
          };
        });
      },
      (err) => console.error('[useCoursePolls] pollUpdated subscription error:', err),
    );
  }, []);

  const addPoll = useCallback((p: Poll) => {
    setState((prev) => {
      if (prev.polls.some((e) => e.ID === p.ID)) return prev;
      offsetRef.current += 1;
      return {
        ...prev,
        polls: [p, ...prev.polls],
        total: prev.total + 1,
        unvotedTotal: prev.unvotedTotal + (isPollUnvoted(p) ? 1 : 0),
      };
    });
  }, []);

  // p は votePoll の応答(options だけを含む部分オブジェクト)を受け取り、
  // 既存の Poll に上書きマージする(user 等は再取得しない)。
  const updatePoll = useCallback((p: Poll | PollVoteUpdate) => {
    setState((prev) => {
      const existing = prev.polls.find((e) => e.ID === p.ID);
      if (!existing) return prev;
      const next = { ...existing, ...p };
      return {
        ...prev,
        polls: prev.polls.map((e) => (e.ID === p.ID ? next : e)),
        unvotedTotal: prev.unvotedTotal + unvotedDelta(existing, next),
      };
    });
  }, []);

  const removePoll = useCallback((pollID: string) => {
    setState((prev) => {
      const removed = prev.polls.find((e) => e.ID === pollID);
      if (!removed) return prev;
      offsetRef.current -= 1;
      return {
        ...prev,
        polls: prev.polls.filter((e) => e.ID !== pollID),
        total: prev.total - 1,
        unvotedTotal: Math.max(0, prev.unvotedTotal - (isPollUnvoted(removed) ? 1 : 0)),
      };
    });
  }, []);

  return {
    ...state,
    hasMore: state.polls.length < state.total,
    loadingMore,
    loadMore,
    subscribePollUpdates,
    addPoll,
    updatePoll,
    removePoll,
  };
};
