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
};

export type Question = {
  ID: string;
  roomID: string;
  user: MessageUser;
  body: string;
  isAnswered: boolean;
  bestAnswer: Answer | null;
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
    }
  }
`);

const SelectBestAnswerDocument = graphql(`
  mutation SelectBestAnswer($questionID: ID!, $answerID: ID!) {
    selectBestAnswer(questionID: $questionID, answerID: $answerID) {
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
      }
      createdAt
      updatedAt
    }
  }
`);

export type QuestionPage = { items: Question[]; total: number };

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

export const selectBestAnswer = async (questionID: string, answerID: string): Promise<Question> => {
  const data = await requestDoc(SelectBestAnswerDocument, { questionID, answerID }, getUserToken());
  return data.selectBestAnswer;
};
