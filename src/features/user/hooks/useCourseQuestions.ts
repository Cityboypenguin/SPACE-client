import { useCallback, useEffect, useRef, useState } from 'react';
import { listQuestions, type Answer, type Question, QUESTION_FIELDS, ANSWER_FIELDS } from '../api/question';
import { subscribeToGraphQL } from '../../../lib/graphqlWs';
import { toUserMessage } from '../../../lib/errorMessages';

const QUESTION_ADDED_SUBSCRIPTION = `
  subscription QuestionAdded($roomID: ID!) {
    questionAdded(roomID: $roomID) {
      ${QUESTION_FIELDS}
    }
  }
`;

const QUESTION_UPDATED_SUBSCRIPTION = `
  subscription QuestionUpdated($roomID: ID!) {
    questionUpdated(roomID: $roomID) {
      ${QUESTION_FIELDS}
    }
  }
`;

const ANSWER_ADDED_SUBSCRIPTION = `
  subscription AnswerAdded($questionID: ID!) {
    answerAdded(questionID: $questionID) {
      ${ANSWER_FIELDS}
    }
  }
`;

type QuestionAddedData = { questionAdded: Question };
type QuestionUpdatedData = { questionUpdated: Question };
type AnswerAddedData = { answerAdded: Answer };

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
          questions: prev.questions.map((e) => (e.ID === q.ID ? q : e)),
        }));
      },
      (err) => console.error('[useCourseQuestions] questionUpdated subscription error:', err),
    );
    return () => unsubscribe();
  }, [roomId]);

  // 一覧全体に answerAdded を張ると質問数だけ WebSocket 購読が増えてしまうため、
  // 展開中の質問カードだけが個別に呼び出す購読関数として公開する。
  const subscribeAnswers = useCallback((questionID: string) => {
    return subscribeToGraphQL<AnswerAddedData>(
      ANSWER_ADDED_SUBSCRIPTION,
      { questionID },
      (data) => {
        const answer = data.answerAdded;
        if (!answer) return;
        setState((prev) => ({
          ...prev,
          questions: prev.questions.map((q) =>
            q.ID === questionID && !q.answers.some((a) => a.ID === answer.ID)
              ? { ...q, answers: [...q.answers, answer] }
              : q,
          ),
        }));
      },
      (err) => console.error('[useCourseQuestions] answerAdded subscription error:', err),
    );
  }, []);

  const addQuestion = useCallback((q: Question) => {
    setState((prev) => {
      if (prev.questions.some((e) => e.ID === q.ID)) return prev;
      offsetRef.current += 1;
      return { ...prev, questions: [q, ...prev.questions], total: prev.total + 1 };
    });
  }, []);

  const addAnswer = useCallback((questionID: string, answer: Answer) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.ID === questionID && !q.answers.some((a) => a.ID === answer.ID)
          ? { ...q, answers: [...q.answers, answer] }
          : q,
      ),
    }));
  }, []);

  const updateQuestion = useCallback((q: Question) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((e) => (e.ID === q.ID ? q : e)),
    }));
  }, []);

  return {
    ...state,
    hasMore: state.questions.length < state.total,
    loadingMore,
    loadMore,
    subscribeAnswers,
    addQuestion,
    addAnswer,
    updateQuestion,
  };
};
