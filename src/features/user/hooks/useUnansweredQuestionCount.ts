import { useEffect } from 'react';
import useSWR from 'swr';
import { getUnansweredQuestionCount } from '../api/question';
import { subscribeToGraphQL } from '../../../lib/graphqlWs';
import { stableCacheOptions } from '../cache/swrOptions';

const QUESTION_CHANGE_SUBSCRIPTIONS = [
  'subscription UnansweredCountQuestionAdded($roomID: ID!) { questionAdded(roomID: $roomID) { ID } }',
  'subscription UnansweredCountQuestionUpdated($roomID: ID!) { questionUpdated(roomID: $roomID) { ID } }',
  'subscription UnansweredCountQuestionDeleted($roomID: ID!) { questionDeleted(roomID: $roomID) { ID } }',
];

// ベストアンサーが決まっていない質問の数。質問箱を開いていなくてもタブに出す。
//
// 通知の中身から増減を計算せず、変わったら数え直す。削除の通知は ID しか持たず、
// 一覧を読んでいないタブでは、消えた質問が未決だったかを判断できないため。
export const useUnansweredQuestionCount = (roomId: string | undefined): number => {
  const { data, mutate } = useSWR(
    roomId ? ['unanswered-question-count', roomId] : null,
    ([, id]: [string, string]) => getUnansweredQuestionCount(id),
    stableCacheOptions,
  );

  useEffect(() => {
    if (!roomId) return;
    const unsubscribes = QUESTION_CHANGE_SUBSCRIPTIONS.map((query) =>
      subscribeToGraphQL(
        query,
        { roomID: roomId },
        () => { void mutate(); },
        (err) => console.error('[useUnansweredQuestionCount] subscription error:', err),
      ),
    );
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [roomId, mutate]);

  return data ?? 0;
};
