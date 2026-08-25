import { useCallback, useEffect, useRef, useState } from 'react';
import { listPolls, type Poll, POLL_FIELDS } from '../api/poll';
import { subscribeToGraphQL } from '../../../lib/graphqlWs';
import { toUserMessage } from '../../../lib/errorMessages';

const POLL_ADDED_SUBSCRIPTION = `
  subscription PollAdded($roomID: ID!) {
    pollAdded(roomID: $roomID) {
      ${POLL_FIELDS}
    }
  }
`;

const POLL_UPDATED_SUBSCRIPTION = `
  subscription PollUpdated($pollID: ID!) {
    pollUpdated(pollID: $pollID) {
      ${POLL_FIELDS}
    }
  }
`;

type PollAddedData = { pollAdded: Poll };
type PollUpdatedData = { pollUpdated: Poll };

const PAGE_SIZE = 50;

type State = {
  polls: Poll[];
  total: number;
  loading: boolean;
  error: string;
};

export const useCoursePolls = (roomId: string | undefined) => {
  const [state, setState] = useState<State>({ polls: [], total: 0, loading: true, error: '' });
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    offsetRef.current = 0;
    setState({ polls: [], total: 0, loading: true, error: '' });

    (async () => {
      try {
        const page = await listPolls(roomId, PAGE_SIZE, 0);
        if (!active) return;
        offsetRef.current = page.items.length;
        setState({ polls: page.items, total: page.total, loading: false, error: '' });
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
          return { ...prev, polls: [p, ...prev.polls], total: prev.total + 1 };
        });
      },
      (err) => console.error('[useCoursePolls] pollAdded subscription error:', err),
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
        setState((prev) => ({
          ...prev,
          polls: prev.polls.map((e) => (e.ID === p.ID ? p : e)),
        }));
      },
      (err) => console.error('[useCoursePolls] pollUpdated subscription error:', err),
    );
  }, []);

  const addPoll = useCallback((p: Poll) => {
    setState((prev) => {
      if (prev.polls.some((e) => e.ID === p.ID)) return prev;
      offsetRef.current += 1;
      return { ...prev, polls: [p, ...prev.polls], total: prev.total + 1 };
    });
  }, []);

  const updatePoll = useCallback((p: Poll) => {
    setState((prev) => ({
      ...prev,
      polls: prev.polls.map((e) => (e.ID === p.ID ? p : e)),
    }));
  }, []);

  return {
    ...state,
    hasMore: state.polls.length < state.total,
    loadingMore,
    loadMore,
    subscribePollUpdates,
    addPoll,
    updatePoll,
  };
};
