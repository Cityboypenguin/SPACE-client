import { useEffect, useState } from 'react';
import { listMessages, getRoom, type Message, type Room } from '../api/message';
import { subscribeToGraphQL } from '../../../lib/graphqlWs';

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
  createdAt
  updatedAt
`;

const MESSAGE_ADDED_SUBSCRIPTION = `
  subscription MessageAdded($roomID: ID!) {
    messageAdded(roomID: $roomID) {
      ${MESSAGE_FIELDS}
    }
  }
`;

const MESSAGE_DELETED_SUBSCRIPTION = `
  subscription MessageDeleted($roomID: ID!) {
    messageDeleted(roomID: $roomID) {
      ID
    }
  }
`;

const MESSAGE_UPDATED_SUBSCRIPTION = `
  subscription MessageUpdated($roomID: ID!) {
    messageUpdated(roomID: $roomID) {
      ${MESSAGE_FIELDS}
    }
  }
`;

type MessageAddedData = { messageAdded: Message };
type MessageDeletedData = { messageDeleted: { ID: string } };
type MessageUpdatedData = { messageUpdated: Message };

type State = {
  room: Room | null;
  messages: Message[];
  wsConnected: boolean;
  error: string;
};

export const useRoomMessages = (roomId: string | undefined) => {
  const [state, setState] = useState<State>({
    room: null,
    messages: [],
    wsConnected: false,
    error: '',
  });

  useEffect(() => {
    if (!roomId) return;
    let active = true;

    (async () => {
      try {
        const [roomData, msgData] = await Promise.all([
          getRoom(roomId),
          listMessages(roomId),
        ]);
        if (!active) return;
        setState((prev) => ({ ...prev, room: roomData.room, messages: msgData.messages }));
      } catch (err) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'ルームの読み込みに失敗しました';
        setState((prev) => ({ ...prev, error: msg }));
      }
    })();

    return () => { active = false; };
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToGraphQL<MessageAddedData>(
      MESSAGE_ADDED_SUBSCRIPTION,
      { roomID: roomId },
      (data) => {
        setState((prev) => {
          const newMsg = data.messageAdded;
          if (!newMsg) return prev;
          if (prev.messages.some((m) => m.ID === newMsg.ID)) return prev;
          return { ...prev, wsConnected: true, messages: [...prev.messages, newMsg] };
        });
      },
      (err) => {
        console.error('[useRoomMessages] subscription error:', err);
        setState((prev) => ({ ...prev, wsConnected: false }));
      },
      () => setState((prev) => ({ ...prev, wsConnected: true })),
    );

    return () => {
      unsubscribe();
      setState((prev) => ({ ...prev, wsConnected: false }));
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToGraphQL<MessageDeletedData>(
      MESSAGE_DELETED_SUBSCRIPTION,
      { roomID: roomId },
      (data) => {
        const deletedMsg = data.messageDeleted;
        if (!deletedMsg) return;
        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.ID !== deletedMsg.ID),
        }));
      },
      (err) => console.error('[useRoomMessages] delete subscription error:', err),
    );

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToGraphQL<MessageUpdatedData>(
      MESSAGE_UPDATED_SUBSCRIPTION,
      { roomID: roomId },
      (data) => {
        const updatedMsg = data.messageUpdated;
        if (!updatedMsg) return;
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) => (m.ID === updatedMsg.ID ? updatedMsg : m)),
        }));
      },
      (err) => console.error('[useRoomMessages] update subscription error:', err),
    );

    return () => unsubscribe();
  }, [roomId]);

  const addMessage = (msg: Message) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.some((m) => m.ID === msg.ID)
        ? prev.messages
        : [...prev.messages, msg],
    }));
  };

  return { ...state, addMessage };
};
