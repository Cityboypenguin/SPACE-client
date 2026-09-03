import { request, requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { getUserToken } from './auth';
import type { MessageUser } from './message';

export type Answer = {
  ID: string;
  questionID: string;
  user: MessageUser;
  body: string;
  createdAt: string;
  isMine: boolean;
  likeCount: number;
  likedByMe: boolean;
};

export type Question = {
  ID: string;
  roomID: string;
  user: MessageUser;
  body: string;
  isAnswered: boolean;
  bestAnswer: Pick<Answer, 'ID' | 'body'> | null;
  // 質問一覧では回答本体を全件取得しない(詳細を開いた時だけ useQuestionAnswers で
  // ページングして取得する)ため、ここでは件数のみを持つ。
  answers: { total: number };
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
};

// useCourseQuestions.ts の WebSocket サブスクリプション（codegen 対象外の
// subscribeToGraphQL 経由）が参照するため、フィールド選択の文字列定数を公開する
// （useRoomMessages.ts の MESSAGE_FIELDS と同じ理由）。
export const QUESTION_FIELDS = `
  ID
  roomID
  user {
    ID
    name
    accountID
    avatarUrl
  }
  body
  isAnswered
  isMine
  bestAnswer {
    ID
    body
  }
  answers(limit: 0) {
    total
  }
  createdAt
  updatedAt
`;

export const ANSWER_FIELDS = `
  ID
  questionID
  user {
    ID
    name
    accountID
    avatarUrl
  }
  body
  createdAt
  isMine
  likeCount
  likedByMe
`;

const QuestionsDocument = graphql(`
  query Questions($roomID: ID!, $limit: Int, $offset: Int) {
    questions(roomID: $roomID, limit: $limit, offset: $offset) {
      items {
        ID
        roomID
        user {
          ID
          name
          accountID
          avatarUrl
        }
        body
        isAnswered
        isMine
        bestAnswer {
          ID
          body
        }
        answers(limit: 0) {
          total
        }
        createdAt
        updatedAt
      }
      total
    }
  }
`);

const CreateQuestionDocument = graphql(`
  mutation CreateQuestion($roomID: ID!, $body: String!) {
    createQuestion(roomID: $roomID, body: $body) {
      ID
      roomID
      user {
        ID
        name
        accountID
        avatarUrl
      }
      body
      isAnswered
      isMine
      bestAnswer {
        ID
        body
      }
      answers(limit: 0) {
        total
      }
      createdAt
      updatedAt
    }
  }
`);

const UPDATE_QUESTION_MUTATION = `
  mutation UpdateQuestion($id: ID!, $body: String!) {
    updateQuestion(id: $id, body: $body) {
      ID
      body
      updatedAt
    }
  }
`;

const DELETE_QUESTION_MUTATION = `
  mutation DeleteQuestion($id: ID!) {
    deleteQuestion(id: $id)
  }
`;

const AnswerQuestionDocument = graphql(`
  mutation AnswerQuestion($questionID: ID!, $body: String!) {
    answerQuestion(questionID: $questionID, body: $body) {
      ID
      questionID
      user {
        ID
        name
        accountID
        avatarUrl
      }
      body
      createdAt
      isMine
      likeCount
      likedByMe
    }
  }
`);

// ベストアンサーの選択/取り消しは isAnswered と bestAnswer だけが変わる操作なので、
// answers 一覧は返さない(クライアントは既存の回答一覧をそのまま保持する)。
// bestAnswer は一覧カードのプレビュー表示に使うため body まで取得する。
const SelectBestAnswerDocument = graphql(`
  mutation SelectBestAnswer($questionID: ID!, $answerID: ID!) {
    selectBestAnswer(questionID: $questionID, answerID: $answerID) {
      ID
      isAnswered
      bestAnswer {
        ID
        body
      }
      updatedAt
    }
  }
`);

const CancelBestAnswerDocument = graphql(`
  mutation CancelBestAnswer($questionID: ID!) {
    cancelBestAnswer(questionID: $questionID) {
      ID
      isAnswered
      bestAnswer {
        ID
        body
      }
      updatedAt
    }
  }
`);

const UpdateAnswerDocument = graphql(`
  mutation UpdateAnswer($id: ID!, $body: String!) {
    updateAnswer(id: $id, body: $body) {
      ID
      body
    }
  }
`);

const DeleteAnswerDocument = graphql(`
  mutation DeleteAnswer($id: ID!) {
    deleteAnswer(id: $id)
  }
`);

const LikeAnswerDocument = graphql(`
  mutation LikeAnswer($id: ID!) {
    likeAnswer(id: $id) {
      ID
      likeCount
      likedByMe
    }
  }
`);

const UnlikeAnswerDocument = graphql(`
  mutation UnlikeAnswer($id: ID!) {
    unlikeAnswer(id: $id) {
      ID
      likeCount
      likedByMe
    }
  }
`);

const QuestionAnswersDocument = graphql(`
  query QuestionAnswers($id: ID!, $limit: Int, $offset: Int) {
    question(id: $id) {
      ID
      answers(limit: $limit, offset: $offset) {
        items {
          ID
          questionID
          user {
            ID
            name
            accountID
            avatarUrl
          }
          body
          createdAt
          isMine
          likeCount
          likedByMe
        }
        total
      }
    }
  }
`);

export type QuestionPage = { items: Question[]; total: number };
export type AnswerPage = { items: Answer[]; total: number };

// selectBestAnswer/cancelBestAnswer の応答は Question の一部フィールドのみ
// (answers を含まない)。呼び出し側は既存の Question に上書きマージして使う。
export type QuestionBestAnswerUpdate = Pick<Question, 'ID' | 'isAnswered' | 'bestAnswer' | 'updatedAt'>;
export type AnswerLikeUpdate = Pick<Answer, 'ID' | 'likeCount' | 'likedByMe'>;
export type AnswerBodyUpdate = Pick<Answer, 'ID' | 'body'>;
export type QuestionBodyUpdate = Pick<Question, 'ID' | 'body' | 'updatedAt'>;

export const listQuestions = async (roomID: string, limit = 50, offset = 0): Promise<QuestionPage> => {
  const data = await requestDoc(QuestionsDocument, { roomID, limit, offset }, getUserToken());
  return data.questions;
};

export const createQuestion = async (roomID: string, body: string): Promise<Question> => {
  const data = await requestDoc(CreateQuestionDocument, { roomID, body }, getUserToken());
  return data.createQuestion;
};

export const updateQuestionBody = async (id: string, body: string): Promise<QuestionBodyUpdate> => {
  const data = await request<{ updateQuestion: QuestionBodyUpdate }>(
    UPDATE_QUESTION_MUTATION,
    { id, body },
    getUserToken(),
  );
  return data.updateQuestion;
};

export const deleteQuestion = async (id: string): Promise<boolean> => {
  const data = await request<{ deleteQuestion: boolean }>(DELETE_QUESTION_MUTATION, { id }, getUserToken());
  return data.deleteQuestion;
};

export const answerQuestion = async (questionID: string, body: string): Promise<Answer> => {
  const data = await requestDoc(AnswerQuestionDocument, { questionID, body }, getUserToken());
  return data.answerQuestion;
};

export const selectBestAnswer = async (questionID: string, answerID: string): Promise<QuestionBestAnswerUpdate> => {
  const data = await requestDoc(SelectBestAnswerDocument, { questionID, answerID }, getUserToken());
  return data.selectBestAnswer;
};

export const cancelBestAnswer = async (questionID: string): Promise<QuestionBestAnswerUpdate> => {
  const data = await requestDoc(CancelBestAnswerDocument, { questionID }, getUserToken());
  return data.cancelBestAnswer;
};

export const updateAnswer = async (id: string, body: string): Promise<AnswerBodyUpdate> => {
  const data = await requestDoc(UpdateAnswerDocument, { id, body }, getUserToken());
  return data.updateAnswer;
};

export const deleteAnswer = async (id: string): Promise<boolean> => {
  const data = await requestDoc(DeleteAnswerDocument, { id }, getUserToken());
  return data.deleteAnswer;
};

export const likeAnswer = async (id: string): Promise<AnswerLikeUpdate> => {
  const data = await requestDoc(LikeAnswerDocument, { id }, getUserToken());
  return data.likeAnswer;
};

export const unlikeAnswer = async (id: string): Promise<AnswerLikeUpdate> => {
  const data = await requestDoc(UnlikeAnswerDocument, { id }, getUserToken());
  return data.unlikeAnswer;
};

export const listAnswers = async (questionID: string, limit = 20, offset = 0): Promise<AnswerPage> => {
  const data = await requestDoc(QuestionAnswersDocument, { id: questionID, limit, offset }, getUserToken());
  return data.question?.answers ?? { items: [], total: 0 };
};
