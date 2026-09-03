import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listQuestions,
  type Question, type QuestionBestAnswerUpdate, type QuestionBodyUpdate,
  QUESTION_FIELDS,
} from '../api/question';
import { subscribeToGraphQL } from '../../../lib/graphqlWs';
import { toUserMessage } from '../../../lib/errorMessages';

const QUESTION_ADDED_SUBSCRIPTION = `
  subscription QuestionAdded($roomID: ID!) {
    questionAdded(roomID: $roomID) {
      ${QUESTION_FIELDS}
    }
  }
`;

// questionUpdated は selectBestAnswer/cancelBestAnswer によってのみ発火し、
// isAnswered と bestAnswer だけが変わる。質問一覧を開いている閲覧者全員に
// 配信されるため、変わらない情報は含めない。
const QUESTION_UPDATED_SUBSCRIPTION = `
  subscription QuestionUpdated($roomID: ID!) {
    questionUpdated(roomID: $roomID) {
      ID
      isAnswered
      bestAnswer {
        ID
        body
      }
      updatedAt
    }
  }
`;

const QUESTION_DELETED_SUBSCRIPTION = `
  subscription QuestionDeleted($roomID: ID!) {
    questionDeleted(roomID: $roomID) {
      ID
    }
  }
`;

type QuestionAddedData = { questionAdded: Question };
type QuestionUpdatedData = { questionUpdated: QuestionBestAnswerUpdate };
type QuestionDeletedData = { questionDeleted: Pick<Question, 'ID'> };

const PAGE_SIZE = 50;

type State = {
  questions: Question[];
  total: number;
  loading: boolean;
  error: string;
};

export const useCourseQuestions = (roomId: string | undefined) => {
  const [state, setState] = useState<State>({ questions: [], total: 0, loading: true, error: '' });
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    offsetRef.current = 0;
    setState({ questions: [], total: 0, loading: true, error: '' });

    (async () => {
      try {
        const page = await listQuestions(roomId, PAGE_SIZE, 0);
        if (!active) return;
        offsetRef.current = page.items.length;
        setState({ questions: page.items, total: page.total, loading: false, error: '' });
      } catch (err) {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: toUserMessage(err, '質問の読み込みに失敗しました。時間をおいてから再度お試しください。'),
        }));
      }
    })();

    return () => { active = false; };
  }, [roomId]);

  const loadMore = useCallback(async () => {
    if (!roomId || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listQuestions(roomId, PAGE_SIZE, offsetRef.current);
      offsetRef.current += page.items.length;
      setState((prev) => ({
        ...prev,
        questions: [...prev.questions, ...page.items.filter((q) => !prev.questions.some((e) => e.ID === q.ID))],
        total: page.total,
      }));
    } finally {
      setLoadingMore(false);
    }
  }, [roomId, loadingMore]);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = subscribeToGraphQL<QuestionAddedData>(
      QUESTION_ADDED_SUBSCRIPTION,
      { roomID: roomId },
      (data) => {
        const q = data.questionAdded;
        if (!q) return;
        setState((prev) => {
          if (prev.questions.some((e) => e.ID === q.ID)) return prev;
          offsetRef.current += 1;
          return { ...prev, questions: [q, ...prev.questions], total: prev.total + 1 };
        });
      },
      (err) => console.error('[useCourseQuestions] questionAdded subscription error:', err),
    );
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = subscribeToGraphQL<QuestionUpdatedData>(
      QUESTION_UPDATED_SUBSCRIPTION,
      { roomID: roomId },
      (data) => {
        const q = data.questionUpdated;
        if (!q) return;
        setState((prev) => ({
          ...prev,
          questions: prev.questions.map((e) => (e.ID === q.ID ? { ...e, ...q } : e)),
        }));
      },
      (err) => console.error('[useCourseQuestions] questionUpdated subscription error:', err),
    );
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = subscribeToGraphQL<QuestionDeletedData>(
      QUESTION_DELETED_SUBSCRIPTION,
      { roomID: roomId },
      (data) => {
        const deletedID = data.questionDeleted?.ID;
        if (!deletedID) return;
        setState((prev) => ({
          ...prev,
          questions: prev.questions.filter((q) => q.ID !== deletedID),
          total: Math.max(0, prev.total - 1),
        }));
        offsetRef.current = Math.max(0, offsetRef.current - 1);
      },
      (err) => console.error('[useCourseQuestions] questionDeleted subscription error:', err),
    );
    return () => unsubscribe();
  }, [roomId]);

  const addQuestion = useCallback((q: Question) => {
    setState((prev) => {
      if (prev.questions.some((e) => e.ID === q.ID)) return prev;
      offsetRef.current += 1;
      return { ...prev, questions: [q, ...prev.questions], total: prev.total + 1 };
    });
  }, []);

  // q は questionUpdated 購読からの部分オブジェクト(selectBestAnswer/cancelBestAnswer
  // の応答と同じ形)を受け取り、既存の Question に上書きマージする。
  const updateQuestion = useCallback((q: QuestionBestAnswerUpdate | QuestionBodyUpdate) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((e) => (e.ID === q.ID ? { ...e, ...q } : e)),
    }));
  }, []);

  // 回答の投稿・削除は質問一覧側の件数(answers.total)だけを増減させる。回答本体は
  // 質問詳細を開いている間 useQuestionAnswers が個別に持つ。
  const bumpAnswerCount = useCallback((questionID: string, delta: number) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.ID === questionID ? { ...q, answers: { total: Math.max(0, q.answers.total + delta) } } : q,
      ),
    }));
  }, []);

  const removeQuestion = useCallback((questionID: string) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.ID !== questionID),
      total: Math.max(0, prev.total - 1),
    }));
    offsetRef.current = Math.max(0, offsetRef.current - 1);
  }, []);

  return {
    ...state,
    hasMore: state.questions.length < state.total,
    loadingMore,
    loadMore,
    addQuestion,
    updateQuestion,
    bumpAnswerCount,
    removeQuestion,
  };
};
