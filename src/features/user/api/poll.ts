import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { getUserToken } from './auth';
import type { MessageUser } from './message';

export type PollOption = {
  ID: string;
  label: string;
  voteCount: number;
  votedByMe: boolean;
};

export type PollUser = MessageUser & {
  role: string;
};

export type Poll = {
  ID: string;
  roomID: string;
  user: PollUser;
  question: string;
  allowMultipleChoice: boolean;
  options: PollOption[];
  deadline?: string | null;
  createdAt: string;
  isMine: boolean;
};

// useCoursePolls.ts の WebSocket サブスクリプション（codegen 対象外の
// subscribeToGraphQL 経由）が参照するため、フィールド選択の文字列定数を公開する
// （useRoomMessages.ts の MESSAGE_FIELDS と同じ理由）。
export const POLL_FIELDS = `
  ID
  roomID
  user {
    ID
    name
    accountID
    avatarUrl
    role
  }
  question
  allowMultipleChoice
  options {
    ID
    label
    voteCount
    votedByMe
  }
  deadline
  createdAt
  isMine
`;

const PollsDocument = graphql(`
  query Polls($roomID: ID!, $limit: Int, $offset: Int) {
    polls(roomID: $roomID, limit: $limit, offset: $offset) {
      items {
        ID
        roomID
        user {
          ID
          name
          accountID
          avatarUrl
          role
        }
        question
        allowMultipleChoice
        options {
          ID
          label
          voteCount
          votedByMe
        }
        deadline
        createdAt
        isMine
      }
      total
    }
  }
`);

const CreatePollDocument = graphql(`
  mutation CreatePoll($roomID: ID!, $question: String!, $options: [String!]!, $allowMultipleChoice: Boolean, $deadline: String) {
    createPoll(roomID: $roomID, question: $question, options: $options, allowMultipleChoice: $allowMultipleChoice, deadline: $deadline) {
      ID
      roomID
      user {
        ID
        name
        accountID
        avatarUrl
        role
      }
      question
      allowMultipleChoice
      options {
        ID
        label
        voteCount
        votedByMe
      }
      deadline
      createdAt
      isMine
    }
  }
`);

// 投票では options(得票数/自分の投票状況)しか変わらないため、変わらない
// user/question/allowMultipleChoice 等は再取得しない。
const VotePollDocument = graphql(`
  mutation VotePoll($pollID: ID!, $optionIDs: [ID!]!) {
    votePoll(pollID: $pollID, optionIDs: $optionIDs) {
      ID
      options {
        ID
        label
        voteCount
        votedByMe
      }
    }
  }
`);

const DeletePollDocument = graphql(`
  mutation DeletePoll($pollID: ID!) {
    deletePoll(pollID: $pollID)
  }
`);

export type PollPage = { items: Poll[]; total: number };

// votePoll/pollUpdated の応答は options(得票数)だけを含む部分オブジェクト。
// 呼び出し側は既存の Poll に上書きマージして使う。
export type PollVoteUpdate = Pick<Poll, 'ID' | 'options'>;

export const listPolls = async (roomID: string, limit = 50, offset = 0): Promise<PollPage> => {
  const data = await requestDoc(PollsDocument, { roomID, limit, offset }, getUserToken());
  return data.polls;
};

export const createPoll = async (
  roomID: string,
  question: string,
  options: string[],
  allowMultipleChoice = false,
  deadline?: string,
): Promise<Poll> => {
  const data = await requestDoc(CreatePollDocument, { roomID, question, options, allowMultipleChoice, deadline }, getUserToken());
  return data.createPoll;
};

export const votePoll = async (pollID: string, optionIDs: string[]): Promise<PollVoteUpdate> => {
  const data = await requestDoc(VotePollDocument, { pollID, optionIDs }, getUserToken());
  return data.votePoll;
};

export const deletePoll = async (pollID: string): Promise<boolean> => {
  const data = await requestDoc(DeletePollDocument, { pollID }, getUserToken());
  return data.deletePoll;
};
