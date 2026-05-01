import { request } from '../../../lib/graphql';
import { USER_TOKEN_KEY } from './auth';

export type MessageUser = {
  ID: string;
  name: string;
  accountID: string;
};

export type Message = {
  ID: string;
  roomID: string;
  accountID: string;
  user: MessageUser;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Room = {
  ID: string;
  name: string;
  type: string;
  user: MessageUser[];
};

const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY) ?? undefined;

const GET_OR_CREATE_DM_ROOM_MUTATION = `
  mutation GetOrCreateDMRoom($targetUserID: ID!) {
    getOrCreateDMRoom(targetUserID: $targetUserID) {
      ID
      name
      type
      user {
        ID
        name
        accountID
      }
    }
  }
`;

const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($roomID: ID!, $content: String!) {
    sendMessage(roomID: $roomID, content: $content) {
      ID
      roomID
      user {
        ID
        name
        accountID
      }
      content
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_MESSAGE_MUTATION = `
  mutation UpdateMessage($roomID: ID!, $id: ID!, $content: String!) {
    updateMessage(roomID: $roomID, id: $id, content: $content) {
      ID
      roomID
      user {
        ID
        name
        accountID
      }
      content
      createdAt
      updatedAt
    }
  }
`;

const DELETE_MESSAGE_MUTATION = `
  mutation DeleteMessage($roomID: ID!, $id: ID!) {
    deleteMessage(roomID: $roomID, id: $id)
  }
`;

const LIST_MESSAGES_QUERY = `
  query ListMessages($roomID: ID!) {
    messages(roomID: $roomID) {
      ID
      roomID
      user {
        ID
        name
        accountID
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
      user {
        ID
        name
        accountID
      }
    }
  }
`;

const MY_DM_ROOMS_QUERY = `
  query MyDMRooms {
    myDMRooms {
      ID
      name
      type
      user {
        ID
        name
        accountID
      }
    }
  }
`;

export const getOrCreateDMRoom = async (targetUserID: string) => {
  const token = getUserToken();
  return await request<{ getOrCreateDMRoom: Room }>(
    GET_OR_CREATE_DM_ROOM_MUTATION,
    { targetUserID },
    token,
  );
};

export const sendMessage = async (roomID: string, content: string) => {
  const token = getUserToken();
  return await request<{ sendMessage: Message }>(
    SEND_MESSAGE_MUTATION,
    { roomID, content },
    token,
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

export const updateMessage = async (roomID: string, id: string, content: string) => {
  const token = getUserToken();
  return await request<{ updateMessage: Message }>(
    UPDATE_MESSAGE_MUTATION,
    { roomID, id, content },
    token,
  );
};

export const deleteMessage = async (roomID: string, id: string) => {
  const token = getUserToken();
  return await request<{ deleteMessage: boolean }>(
    DELETE_MESSAGE_MUTATION,
    { roomID, id },
    token,
  );
};

export const listMyDMRooms = async () => {
  const token = getUserToken();
  return await request<{ myDMRooms: Room[] }>(
    MY_DM_ROOMS_QUERY,
    undefined,
    token,
  ).then((data) => data.myDMRooms);
};
