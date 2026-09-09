import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listAnswers,
  type Answer, type AnswerLikeUpdate, type AnswerBodyUpdate,
  ANSWER_FIELDS,
} from '../api/question';
import { subscribeToGraphQL } from '../../../lib/graphqlWs';
import { toUserMessage } from '../../../lib/errorMessages';

const ANSWER_ADDED_SUBSCRIPTION = `
  subscription AnswerAdded($questionID: ID!) {
    answerAdded(questionID: $questionID) {
      ${ANSWER_FIELDS}
    }
  }
`;

// answerUpdated は「いいね」(高頻度)と「編集」の両方で発火し、質問を開いている
// 閲覧者全員に配信されるため、変わりうるフィールドだけに絞る(user 等は含めない)。
const ANSWER_UPDATED_SUBSCRIPTION = `
  subscription AnswerUpdated($questionID: ID!) {
    answerUpdated(questionID: $questionID) {
      ID
      body
      likeCount
      likedByMe
    }
  }
`;

const ANSWER_DELETED_SUBSCRIPTION = `
  subscription AnswerDeleted($questionID: ID!) {
    answerDeleted(questionID: $questionID) {
      ID
    }
  }
`;

type AnswerAddedData = { answerAdded: Answer };
type AnswerUpdatedData = { answerUpdated: AnswerLikeUpdate & AnswerBodyUpdate };
type AnswerDeletedData = { answerDeleted: Pick<Answer, 'ID'> };

const PAGE_SIZE = 20;

type State = {
  answers: Answer[];
  total: number;
  loading: boolean;
  error: string;
};

// 質問詳細を開いている間だけ、その質問の回答を無限スクロールでページング取得する
// (質問一覧側は件数しか持たず、回答本体はここでしか取得しない)。
export const useQuestionAnswers = (questionID: string | undefined) => {
  const [state, setState] = useState<State>({ answers: [], total: 0, loading: true, error: '' });
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!questionID) return;
    let active = true;
    offsetRef.current = 0;
    setState({ answers: [], total: 0, loading: true, error: '' });

    (async () => {
      try {
        const page = await listAnswers(questionID, PAGE_SIZE, 0);
        if (!active) return;
        offsetRef.current = page.items.length;
        setState({ answers: page.items, total: page.total, loading: false, error: '' });
      } catch (err) {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: toUserMessage(err, '回答の読み込みに失敗しました。時間をおいてから再度お試しください。'),
        }));
      }
    })();

    return () => { active = false; };
  }, [questionID]);

  const loadMore = useCallback(async () => {
    if (!questionID || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listAnswers(questionID, PAGE_SIZE, offsetRef.current);
      offsetRef.current += page.items.length;
      setState((prev) => ({
        ...prev,
        answers: [...prev.answers, ...page.items.filter((a) => !prev.answers.some((e) => e.ID === a.ID))],
        total: page.total,
      }));
    } finally {
      setLoadingMore(false);
    }
  }, [questionID, loadingMore]);

  useEffect(() => {
    if (!questionID) return;
    const unsubscribeAdded = subscribeToGraphQL<AnswerAddedData>(
      ANSWER_ADDED_SUBSCRIPTION,
      { questionID },
      (data) => {
        const answer = data.answerAdded;
        if (!answer) return;
        setState((prev) => {
          if (prev.answers.some((a) => a.ID === answer.ID)) return prev;
          offsetRef.current += 1;
          return { ...prev, answers: [...prev.answers, answer], total: prev.total + 1 };
        });
      },
      (err) => console.error('[useQuestionAnswers] answerAdded subscription error:', err),
    );

    const unsubscribeUpdated = subscribeToGraphQL<AnswerUpdatedData>(
      ANSWER_UPDATED_SUBSCRIPTION,
      { questionID },
      (data) => {
        const answer = data.answerUpdated;
        if (!answer) return;
        // いいね数の変化で無限スクロール中に表示順が動くと体験を損なうため、
        // 並び替えはせずその場でフィールドだけ更新する(並びはサーバー取得時点のまま)。
        setState((prev) => ({
          ...prev,
          answers: prev.answers.map((a) => (a.ID === answer.ID ? { ...a, ...answer } : a)),
        }));
      },
      (err) => console.error('[useQuestionAnswers] answerUpdated subscription error:', err),
    );

    const unsubscribeDeleted = subscribeToGraphQL<AnswerDeletedData>(
      ANSWER_DELETED_SUBSCRIPTION,
      { questionID },
      (data) => {
        const deletedID = data.answerDeleted?.ID;
        if (!deletedID) return;
        setState((prev) => {
          if (!prev.answers.some((a) => a.ID === deletedID)) return prev;
          offsetRef.current = Math.max(0, offsetRef.current - 1);
          return { ...prev, answers: prev.answers.filter((a) => a.ID !== deletedID), total: Math.max(0, prev.total - 1) };
        });
      },
      (err) => console.error('[useQuestionAnswers] answerDeleted subscription error:', err),
    );

    return () => {
      unsubscribeAdded();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [questionID]);

  const addAnswer = useCallback((answer: Answer) => {
    setState((prev) => {
      if (prev.answers.some((a) => a.ID === answer.ID)) return prev;
      offsetRef.current += 1;
      return { ...prev, answers: [...prev.answers, answer], total: prev.total + 1 };
    });
  }, []);

  const updateAnswer = useCallback((answer: AnswerLikeUpdate | AnswerBodyUpdate) => {
    setState((prev) => ({
      ...prev,
      answers: prev.answers.map((a) => (a.ID === answer.ID ? { ...a, ...answer } : a)),
    }));
  }, []);

  const removeAnswer = useCallback((answerID: string) => {
    setState((prev) => {
      if (!prev.answers.some((a) => a.ID === answerID)) return prev;
      offsetRef.current = Math.max(0, offsetRef.current - 1);
      return { ...prev, answers: prev.answers.filter((a) => a.ID !== answerID), total: Math.max(0, prev.total - 1) };
    });
  }, []);

  return {
    ...state,
    hasMore: state.answers.length < state.total,
    loadingMore,
    loadMore,
    addAnswer,
    updateAnswer,
    removeAnswer,
  };
};
