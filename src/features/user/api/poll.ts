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

export type Poll = {
  ID: string;
  roomID: string;
  user: MessageUser;
  question: string;
  allowMultipleChoice: boolean;
  options: PollOption[];
  createdAt: string;
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
  }
  question
  allowMultipleChoice
  options {
    ID
    label
    voteCount
    votedByMe
  }
  createdAt
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
        }
        question
        allowMultipleChoice
        options {
          ID
          label
          voteCount
          votedByMe
        }
        createdAt
      }
      total
    }
  }
`);

const CreatePollDocument = graphql(`
  mutation CreatePoll($roomID: ID!, $question: String!, $options: [String!]!, $allowMultipleChoice: Boolean) {
    createPoll(roomID: $roomID, question: $question, options: $options, allowMultipleChoice: $allowMultipleChoice) {
      ID
      roomID
      user {
        ID
        name
        accountID
        avatarUrl
      }
      question
      allowMultipleChoice
      options {
        ID
        label
        voteCount
        votedByMe
      }
      createdAt
    }
  }
`);

const VotePollDocument = graphql(`
  mutation VotePoll($pollID: ID!, $optionIDs: [ID!]!) {
    votePoll(pollID: $pollID, optionIDs: $optionIDs) {
      ID
      roomID
      user {
        ID
        name
        accountID
        avatarUrl
      }
      question
      allowMultipleChoice
      options {
        ID
        label
        voteCount
        votedByMe
      }
      createdAt
    }
  }
`);

export type PollPage = { items: Poll[]; total: number };

export const listPolls = async (roomID: string, limit = 50, offset = 0): Promise<PollPage> => {
  const data = await requestDoc(PollsDocument, { roomID, limit, offset }, getUserToken());
  return data.polls;
};

export const createPoll = async (
  roomID: string,
  question: string,
  options: string[],
  allowMultipleChoice = false,
): Promise<Poll> => {
  const data = await requestDoc(CreatePollDocument, { roomID, question, options, allowMultipleChoice }, getUserToken());
  return data.createPoll;
};

export const votePoll = async (pollID: string, optionIDs: string[]): Promise<Poll> => {
  const data = await requestDoc(VotePollDocument, { pollID, optionIDs }, getUserToken());
  return data.votePoll;
};
