import { request } from '../../../lib/graphql';
import { getUserToken } from './auth';
export type ChatThread = {
 roomID: string; parentRoomID: string; title: string; isClosed: boolean;
 canManage: boolean; canWrite: boolean; createdAt: string; updatedAt: string;
 messageCount: number; unreadCount: number; lastMessageAt: string | null;
};
const fields = `roomID parentRoomID title isClosed canManage canWrite createdAt updatedAt messageCount unreadCount lastMessageAt`;
export async function listThreads(parentRoomID: string, offset = 0) {
 const data = await request<{chatThreads: ChatThread[]}>(`query ChatThreadList($parentRoomID: ID!, $offset: Int!) { chatThreads(parentRoomID: $parentRoomID, limit: 20, offset: $offset) { ${fields} } }`, {parentRoomID, offset}, getUserToken());
 return data.chatThreads;
}
export async function getThread(roomID: string) {
 const data = await request<{chatThread: ChatThread | null}>(`query ChatThreadDetail($roomID: ID!) { chatThread(roomID: $roomID) { ${fields} } }`, {roomID}, getUserToken());
 return data.chatThread;
}
export async function createThread(parentRoomID: string, title: string) {
 const data = await request<{createChatThread: ChatThread}>(`mutation CreateChatThread($parentRoomID: ID!, $title: String!) { createChatThread(parentRoomID: $parentRoomID, title: $title) { ${fields} } }`, {parentRoomID, title}, getUserToken());
 return data.createChatThread;
}
export async function updateThread(roomID: string, values: {title?: string; closed?: boolean}) {
 const data = await request<{updateChatThread: ChatThread}>(`mutation UpdateChatThread($roomID: ID!, $title: String, $closed: Boolean) { updateChatThread(roomID: $roomID, title: $title, closed: $closed) { ${fields} } }`, {roomID, ...values}, getUserToken());
 return data.updateChatThread;
}

export async function hasUnreadThreads(parentRoomID: string) {
  const data = await request<{hasUnreadChatThreads: boolean}>(
    `query HasUnreadChatThreads($parentRoomID: ID!) { hasUnreadChatThreads(parentRoomID: $parentRoomID) }`,
    {parentRoomID}, getUserToken(),
  );
  return data.hasUnreadChatThreads;
}
