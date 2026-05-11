import { request } from '../../../lib/graphql';
import { USER_TOKEN_KEY } from './auth';

export type MessageUser = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

export type Message = {
  ID: string;
  roomID: string;
  accountID: string;
  user: MessageUser;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Room = {
  ID: string;
  name: string;
  type: string;
  user: MessageUser[];
};

const MESSAGE_FIELDS = `
  ID
  roomID
  user {
    ID
    name
    accountID
    avatarUrl
  }
  content
  attachmentUrl
  attachmentName
  createdAt
  updatedAt
`;

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
        avatarUrl
      }
    }
  }
`;

const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($roomID: ID!, $content: String!, $attachmentKey: String, $attachmentName: String) {
    sendMessage(roomID: $roomID, content: $content, attachmentKey: $attachmentKey, attachmentName: $attachmentName) {
      ${MESSAGE_FIELDS}
    }
  }
`;

const UPDATE_MESSAGE_MUTATION = `
  mutation UpdateMessage($roomID: ID!, $id: ID!, $content: String!) {
    updateMessage(roomID: $roomID, id: $id, content: $content) {
      ${MESSAGE_FIELDS}
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
      ${MESSAGE_FIELDS}
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
        avatarUrl
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
        avatarUrl
      }
    }
  }
`;

const PRESIGNED_MESSAGE_FILE_UPLOAD_URL_QUERY = `
  query PresignedMessageFileUploadUrl($roomID: ID!, $contentType: String!) {
    presignedMessageFileUploadUrl(roomID: $roomID, contentType: $contentType) {
      uploadUrl
      objectKey
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

export const sendMessage = async (roomID: string, content: string, attachmentKey?: string, attachmentName?: string) => {
  const token = getUserToken();
  return await request<{ sendMessage: Message }>(
    SEND_MESSAGE_MUTATION,
    { roomID, content, attachmentKey, attachmentName },
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

export const getPresignedMessageFileUploadUrl = async (roomID: string, contentType: string) => {
  const token = getUserToken();
  if (!token) throw new Error('認証が必要です。');
  return await request<{ presignedMessageFileUploadUrl: { uploadUrl: string; objectKey: string } }>(
    PRESIGNED_MESSAGE_FILE_UPLOAD_URL_QUERY,
    { roomID, contentType },
    token,
  );
};

export const uploadFileToStorage = async (uploadUrl: string, file: File): Promise<void> => {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('ファイルのアップロードに失敗しました。');
};
