import { useEffect, useState } from 'react';
import { listMessages, getRoom, type Message, type Room } from '../api/message';
import { subscribeToGraphQL } from '../../../lib/graphqlWs';

const MESSAGE_SUBSCRIPTION = `
  subscription MessageAdded($roomID: ID!) {
    messageAdded(roomID: $roomID) {
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

type MessageAddedData = { messageAdded: Message };

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
      } catch {
        if (active) setState((prev) => ({ ...prev, error: 'ルームの読み込みに失敗しました' }));
      }
    })();

    return () => { active = false; };
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToGraphQL<MessageAddedData>(
      MESSAGE_SUBSCRIPTION,
      { roomID: roomId },
      (data) => {
        setState((prev) => {
          const newMsg = data.messageAdded;
          if (prev.messages.some((m) => m.ID === newMsg.ID)) return prev;
          return { ...prev, wsConnected: true, messages: [...prev.messages, newMsg] };
        });
      },
      () => setState((prev) => ({ ...prev, wsConnected: false })),
      () => setState((prev) => ({ ...prev, wsConnected: true })),
    );

    return () => {
      unsubscribe();
      setState((prev) => ({ ...prev, wsConnected: false }));
    };
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
