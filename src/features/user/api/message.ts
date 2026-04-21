import { request } from '../../../lib/graphql';
import { USER_TOKEN_KEY } from './auth';

export type MessageUser = {
  ID: string;
  name: string;
  userID: string;
};

export type Message = {
  ID: string;
  roomID: string;
  userID: string;
  user: MessageUser;
  content: string;
  createdAt: string;
};

export type Room = {
  ID: string;
  name: string;
  type: string;
  description: string;
  user: MessageUser[];
};

const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY) ?? undefined;

const GET_OR_CREATE_DM_ROOM_MUTATION = `
  mutation GetOrCreateDMRoom($currentUserID: ID!, $targetUserID: ID!) {
    getOrCreateDMRoom(currentUserID: $currentUserID, targetUserID: $targetUserID) {
      ID
      name
      type
      description
      user {
        ID
        name
        userID
      }
    }
  }
`;

const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($roomID: ID!, $userID: ID!, $content: String!) {
    sendMessage(roomID: $roomID, userID: $userID, content: $content) {
      ID
      roomID
      userID
      user {
        ID
        name
        userID
      }
      content
      createdAt
    }
  }
`;

const LIST_MESSAGES_QUERY = `
  query ListMessages($roomID: ID!) {
    messages(roomID: $roomID) {
      ID
      roomID
      userID
      user {
        ID
        name
        userID
      }
      content
      createdAt
    }
  }
`;

const GET_ROOM_QUERY = `
  query GetRoom($id: ID!) {
    room(id: $id) {
      ID
      name
      type
      description
      user {
        ID
        name
        userID
      }
    }
  }
`;

export const getOrCreateDMRoom = async (currentUserID: string, targetUserID: string) => {
  return await request<{ getOrCreateDMRoom: Room }>(
    GET_OR_CREATE_DM_ROOM_MUTATION,
    { currentUserID, targetUserID },
    getUserToken(),
  );
};

export const sendMessage = async (roomID: string, userID: string, content: string) => {
  return await request<{ sendMessage: Message }>(
    SEND_MESSAGE_MUTATION,
    { roomID, userID, content },
    getUserToken(),
  );
};

export const listMessages = async (roomID: string) => {
  return await request<{ messages: Message[] }>(
    LIST_MESSAGES_QUERY,
    { roomID },
    getUserToken(),
  );
};

export const getRoom = async (id: string) => {
  return await request<{ room: Room }>(
    GET_ROOM_QUERY,
    { id },
    getUserToken(),
  );
};
