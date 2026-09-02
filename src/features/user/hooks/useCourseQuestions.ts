import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listQuestions,
  type Answer, type Question, type QuestionBestAnswerUpdate, type AnswerLikeUpdate, type AnswerBodyUpdate,
  QUESTION_FIELDS, ANSWER_FIELDS,
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
// isAnswered と bestAnswer(ID) だけが変わる。質問一覧を開いている閲覧者全員に
// 配信されるため、user/body/answers 等の変わらない情報は含めない。
const QUESTION_UPDATED_SUBSCRIPTION = `
  subscription QuestionUpdated($roomID: ID!) {
    questionUpdated(roomID: $roomID) {
      ID
      isAnswered
      bestAnswer {
        ID
      }
      updatedAt
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

type QuestionAddedData = { questionAdded: Question };
type QuestionUpdatedData = { questionUpdated: QuestionBestAnswerUpdate };
type AnswerAddedData = { answerAdded: Answer };
type AnswerUpdatedData = { answerUpdated: AnswerLikeUpdate & AnswerBodyUpdate };
type AnswerDeletedData = { answerDeleted: Pick<Answer, 'ID'> };

const PAGE_SIZE = 50;

type State = {
  questions: Question[];
  total: number;
  loading: boolean;
  error: string;
};

// いいねが多い回答を上に表示する(ties は投稿が早い順)。サーバーの一覧・購読の
// どちらもこの順序を保つよう、クライアント側でも新着・更新のたびに並べ直す。
const sortAnswers = (answers: Answer[]) =>
  [...answers].sort((a, b) => {
    if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

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

  // 一覧全体に answer 系の購読を張ると質問数だけ WebSocket 購読が増えてしまうため、
  // 展開中の質問カードだけが個別に呼び出す購読関数として公開する。
  const subscribeAnswers = useCallback((questionID: string) => {
    const unsubscribeAdded = subscribeToGraphQL<AnswerAddedData>(
      ANSWER_ADDED_SUBSCRIPTION,
      { questionID },
      (data) => {
        const answer = data.answerAdded;
        if (!answer) return;
        setState((prev) => ({
          ...prev,
          questions: prev.questions.map((q) =>
            q.ID === questionID && !q.answers.some((a) => a.ID === answer.ID)
              ? { ...q, answers: sortAnswers([...q.answers, answer]) }
              : q,
          ),
        }));
      },
      (err) => console.error('[useCourseQuestions] answerAdded subscription error:', err),
    );

    const unsubscribeUpdated = subscribeToGraphQL<AnswerUpdatedData>(
      ANSWER_UPDATED_SUBSCRIPTION,
      { questionID },
      (data) => {
        const answer = data.answerUpdated;
        if (!answer) return;
        setState((prev) => ({
          ...prev,
          questions: prev.questions.map((q) =>
            q.ID === questionID
              ? { ...q, answers: sortAnswers(q.answers.map((a) => (a.ID === answer.ID ? { ...a, ...answer } : a))) }
              : q,
          ),
        }));
      },
      (err) => console.error('[useCourseQuestions] answerUpdated subscription error:', err),
    );

    const unsubscribeDeleted = subscribeToGraphQL<AnswerDeletedData>(
      ANSWER_DELETED_SUBSCRIPTION,
      { questionID },
      (data) => {
        const deletedID = data.answerDeleted?.ID;
        if (!deletedID) return;
        setState((prev) => ({
          ...prev,
          questions: prev.questions.map((q) =>
            q.ID === questionID ? { ...q, answers: q.answers.filter((a) => a.ID !== deletedID) } : q,
          ),
        }));
      },
      (err) => console.error('[useCourseQuestions] answerDeleted subscription error:', err),
    );

    return () => {
      unsubscribeAdded();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
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
          ? { ...q, answers: sortAnswers([...q.answers, answer]) }
          : q,
      ),
    }));
  }, []);

  // answer は likeAnswer/unlikeAnswer/updateAnswer の応答(変わったフィールドのみ)
  // を受け取り、既存の Answer に上書きマージする(user 等は再取得しない)。
  const updateAnswerInList = useCallback((questionID: string, answer: AnswerLikeUpdate | AnswerBodyUpdate) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.ID === questionID
          ? { ...q, answers: sortAnswers(q.answers.map((a) => (a.ID === answer.ID ? { ...a, ...answer } : a))) }
          : q,
      ),
    }));
  }, []);

  const removeAnswer = useCallback((questionID: string, answerID: string) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.ID === questionID ? { ...q, answers: q.answers.filter((a) => a.ID !== answerID) } : q,
      ),
    }));
  }, []);

  // q は questionUpdated 購読からの完全な Question、または selectBestAnswer/
  // cancelBestAnswer の応答(isAnswered/bestAnswer 等のみを含む部分オブジェクト)の
  // どちらも受け取りうるため、置き換えではなく上書きマージする。
  const updateQuestion = useCallback((q: Question | QuestionBestAnswerUpdate) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((e) => (e.ID === q.ID ? { ...e, ...q } : e)),
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
    updateAnswerInList,
    removeAnswer,
    updateQuestion,
  };
};
