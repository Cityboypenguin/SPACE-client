import { requestDoc } from '../../../lib/graphql';
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
  // ID only: 画面では question.bestAnswer?.ID との一致判定にしか使わないため、
  // 回答本体(user/body/likeCount 等)は取得しない。
  bestAnswer: { ID: string } | null;
  answers: Answer[];
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
  }
  answers {
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
        }
        answers {
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
      }
      answers {
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
      createdAt
      updatedAt
    }
  }
`);

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
// answers 配列は返さない(クライアントは既存の回答一覧をそのまま保持する)。
const SelectBestAnswerDocument = graphql(`
  mutation SelectBestAnswer($questionID: ID!, $answerID: ID!) {
    selectBestAnswer(questionID: $questionID, answerID: $answerID) {
      ID
      isAnswered
      bestAnswer {
        ID
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

export type QuestionPage = { items: Question[]; total: number };

// selectBestAnswer/cancelBestAnswer の応答は Question の一部フィールドのみ
// (answers を含まない)。呼び出し側は既存の Question に上書きマージして使う。
export type QuestionBestAnswerUpdate = Pick<Question, 'ID' | 'isAnswered' | 'bestAnswer' | 'updatedAt'>;
export type AnswerLikeUpdate = Pick<Answer, 'ID' | 'likeCount' | 'likedByMe'>;
export type AnswerBodyUpdate = Pick<Answer, 'ID' | 'body'>;

export const listQuestions = async (roomID: string, limit = 50, offset = 0): Promise<QuestionPage> => {
  const data = await requestDoc(QuestionsDocument, { roomID, limit, offset }, getUserToken());
  return data.questions;
};

export const createQuestion = async (roomID: string, body: string): Promise<Question> => {
  const data = await requestDoc(CreateQuestionDocument, { roomID, body }, getUserToken());
  return data.createQuestion;
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
