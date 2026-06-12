import { useEffect, useRef, useState, useCallback } from 'react';
import { listMessages, getRoom, markRoomAsRead, MESSAGE_FIELDS, type Message, type Room } from '../api/message';
import { subscribeToGraphQL } from '../../../lib/graphqlWs';
import { toUserMessage } from '../../../lib/errorMessages';

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

const ROOM_READ_STATUS_UPDATED_SUBSCRIPTION = `
  subscription RoomReadStatusUpdated($roomID: ID!) {
    roomReadStatusUpdated(roomID: $roomID) {
      userID
      lastReadAt
    }
  }
`;

type MessageAddedData = { messageAdded: Message };
type MessageDeletedData = { messageDeleted: { ID: string } };
type MessageUpdatedData = { messageUpdated: Message };
type RoomReadStatusUpdatedData = { roomReadStatusUpdated: { userID: string; lastReadAt: string } };

type State = {
  room: Room | null;
  messages: Message[];
  wsConnected: boolean;
  error: string;
  initialLastReadAt: string | null;
  partnerLastReadAt: string | null;
};

export const useRoomMessages = (roomId: string | undefined) => {
  const [state, setState] = useState<State>({
    room: null,
    messages: [],
    wsConnected: false,
    error: '',
    initialLastReadAt: null,
    partnerLastReadAt: null,
  });
  const [hasMoreBefore, setHasMoreBefore] = useState(false);
  const [hasMoreAfter, setHasMoreAfter] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadingNewer, setLoadingNewer] = useState(false);

  const markedAsRead = useRef(false);
  const loadingOlderRef = useRef(false);
  const loadingNewerRef = useRef(false);
  const oldestIDRef = useRef<string | undefined>(undefined);
  const newestIDRef = useRef<string | undefined>(undefined);
  // 歴史閲覧中（hasMoreAfter=true）はWebSocketメッセージをスキップする
  const hasMoreAfterRef = useRef(false);

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    markedAsRead.current = false;
    oldestIDRef.current = undefined;
    newestIDRef.current = undefined;

    // ルーム切り替え時にリセット
    setState({ room: null, messages: [], wsConnected: false, error: '', initialLastReadAt: null, partnerLastReadAt: null });
    setHasMoreBefore(false);
    setHasMoreAfter(false);
    hasMoreAfterRef.current = false;

    (async () => {
      try {
        const roomData = await getRoom(roomId);
        if (!active) return;

        const lastReadAt = roomData.room?.lastReadAt ?? null;
        const unreadCount = roomData.room?.unreadCount ?? 0;

        let messages: Message[];
        let moreBefore: boolean;
        let moreAfter: boolean;

        if (unreadCount > 0 && lastReadAt) {
          // 未読あり: 未読開始点の前後25件ずつ取得
          const unreadResult = await listMessages(roomId, 25, { afterTime: lastReadAt });
          if (!active) return;

          if (unreadResult.items.length > 0) {
            const firstUnreadId = unreadResult.items[0].ID;
            const beforeResult = await listMessages(roomId, 25, { before: firstUnreadId });
            if (!active) return;

            messages = [...beforeResult.items, ...unreadResult.items];
            moreBefore = beforeResult.hasMoreBefore;
            moreAfter = unreadResult.hasMoreAfter;
          } else {
            // 未読が実際には存在しない（別端末で既読済みなど）→最新50件
            const result = await listMessages(roomId, 50);
            if (!active) return;
            messages = result.items;
            moreBefore = result.hasMoreBefore;
            moreAfter = false;
          }
        } else {
          // 未読なし: 最新50件
          const result = await listMessages(roomId, 50);
          if (!active) return;
          messages = result.items;
          moreBefore = result.hasMoreBefore;
          moreAfter = false;
        }

        oldestIDRef.current = messages[0]?.ID;
        newestIDRef.current = messages[messages.length - 1]?.ID;

        setState((prev) => ({
          ...prev,
          room: roomData.room,
          messages,
          initialLastReadAt: lastReadAt,
          partnerLastReadAt: roomData.room?.partnerLastReadAt ?? null,
        }));
        setHasMoreBefore(moreBefore);
        setHasMoreAfter(moreAfter);
        hasMoreAfterRef.current = moreAfter;

        if (!markedAsRead.current) {
          markedAsRead.current = true;
          await markRoomAsRead(roomId).catch(() => {});
        }
      } catch (err) {
        if (!active) return;
        const msg = toUserMessage(err, 'チャットルームの読み込みに失敗しました。時間をおいてから再度お試しください。');
        setState((prev) => ({ ...prev, error: msg }));
      }
    })();

    return () => { active = false; };
  }, [roomId]);

  // 上スクロール: 古いメッセージを50件追加取得
  const loadOlderMessages = useCallback(async () => {
    if (!roomId || loadingOlderRef.current) return;
    const before = oldestIDRef.current;
    if (!before) return;

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const result = await listMessages(roomId, 50, { before });
      if (result.items.length > 0) {
        oldestIDRef.current = result.items[0]?.ID;
        setState((prev) => ({
          ...prev,
          messages: [...result.items, ...prev.messages],
        }));
      }
      setHasMoreBefore(result.hasMoreBefore);
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [roomId]);

  // 下スクロール: 新しいメッセージを50件追加取得
  const loadNewerMessages = useCallback(async () => {
    if (!roomId || loadingNewerRef.current) return;
    const after = newestIDRef.current;
    if (!after) return;

    loadingNewerRef.current = true;
    setLoadingNewer(true);
    try {
      const result = await listMessages(roomId, 50, { after });
      if (result.items.length > 0) {
        newestIDRef.current = result.items[result.items.length - 1]?.ID;
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            ...result.items.filter((m) => !prev.messages.some((e) => e.ID === m.ID)),
          ],
        }));
      }
      const newHasMoreAfter = result.hasMoreAfter;
      setHasMoreAfter(newHasMoreAfter);
      hasMoreAfterRef.current = newHasMoreAfter;
    } finally {
      loadingNewerRef.current = false;
      setLoadingNewer(false);
    }
  }, [roomId]);

  // WebSocket: 新着メッセージ（歴史閲覧中はスキップ）
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToGraphQL<MessageAddedData>(
      MESSAGE_ADDED_SUBSCRIPTION,
      { roomID: roomId },
      (data) => {
        const newMsg = data.messageAdded;
        if (!newMsg) return;
        // 歴史閲覧中は新着をスキップ（ページングで追いつく）
        if (hasMoreAfterRef.current) return;
        setState((prev) => {
          if (prev.messages.some((m) => m.ID === newMsg.ID)) return prev;
          return { ...prev, wsConnected: true, messages: [...prev.messages, newMsg] };
        });
        newestIDRef.current = newMsg.ID;
        markRoomAsRead(roomId).catch(() => {});
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

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToGraphQL<RoomReadStatusUpdatedData>(
      ROOM_READ_STATUS_UPDATED_SUBSCRIPTION,
      { roomID: roomId },
      (data) => {
        const update = data.roomReadStatusUpdated;
        if (!update) return;
        setState((prev) => ({ ...prev, partnerLastReadAt: update.lastReadAt }));
      },
      (err) => console.error('[useRoomMessages] read status subscription error:', err),
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
    newestIDRef.current = msg.ID;
  };

  return {
    ...state,
    hasMoreBefore,
    hasMoreAfter,
    loadingOlder,
    loadingNewer,
    loadOlderMessages,
    loadNewerMessages,
    addMessage,
  };
};
