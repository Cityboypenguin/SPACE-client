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

// 返信通知から開いたときなど、特定メッセージを中心にルームを開く指定。
type UseRoomMessagesOptions = {
  aroundMessageId?: string | null;
};

// around 指定でルームを開く／ジャンプするときに前後何件読むか。
const AROUND_LIMIT = 25;

export const useRoomMessages = (roomId: string | undefined, options?: UseRoomMessagesOptions) => {
  const aroundMessageId = options?.aroundMessageId ?? null;
  // ジャンプ先のメッセージID。読み込み完了後にページ側がスクロール・ハイライトして clear する。
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);
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

  // jumpToMessage から最新の messages を読むための参照（依存配列に messages を
  // 入れると、ジャンプのたびに購読が張り直されてしまうため）
  const messagesRef = useRef<Message[]>([]);
  useEffect(() => {
    messagesRef.current = state.messages;
  }, [state.messages]);

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

    Promise.resolve().then(() => {
      if (!active) return;
      setState({ room: null, messages: [], wsConnected: false, error: '', initialLastReadAt: null, partnerLastReadAt: null });
      setHasMoreBefore(false);
      setHasMoreAfter(false);
      hasMoreAfterRef.current = false;
      setPendingScrollId(null);
    });

    (async () => {
      try {
        const roomData = await getRoom(roomId);
        if (!active) return;

        const lastReadAt = roomData.room?.lastReadAt ?? null;
        const lastReadMessageID = roomData.room?.lastReadMessageID ?? null;
        const unreadCount = roomData.room?.unreadCount ?? 0;

        let messages: Message[];
        let moreBefore: boolean;
        let moreAfter: boolean;

        if (aroundMessageId) {
          // 返信通知などから特定メッセージを指定して開いた場合は、未読起点ではなく
          // そのメッセージを中心に読む。
          const result = await listMessages(roomId, AROUND_LIMIT, { around: aroundMessageId });
          if (!active) return;
          messages = result.items;
          moreBefore = result.hasMoreBefore;
          moreAfter = result.hasMoreAfter;
        } else if (unreadCount > 0 && (lastReadMessageID || lastReadAt)) {
          // 未読あり: 未読開始点の前後25件ずつ取得。
          //
          // 起点は既読位置のメッセージID。unreadCount もサーバ側で同じIDを起点に
          // 数えているので、「未読は1件なのに未読ページは0件」という食い違いが出ない。
          // 時刻（lastReadAt）を afterTime に渡していた頃は、既読を打った秒と同じ秒に
          // 届いたメッセージが件数には入るのにページには出てこなかった（時刻は秒解像度で、
          // 同じ秒の中の前後関係を表せないため）。
          //
          // lastReadMessageID が null になるのは、069 のバックフィル対象外だった行
          // （既読時刻を持たないなど）や、まだ ID で既読を打ち直していない古い行。
          // そのときだけ従来の afterTime に落とす（サーバ側の未読件数も同じ順序で
          // ID → 時刻とフォールバックするので、起点の選び方が両者で揃う）。
          const unreadResult = lastReadMessageID
            ? await listMessages(roomId, 25, { after: lastReadMessageID })
            : await listMessages(roomId, 25, { afterTime: lastReadAt ?? undefined });
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
        if (aroundMessageId) setPendingScrollId(aroundMessageId);

        if (!markedAsRead.current) {
          markedAsRead.current = true;
          // 既読位置として送るのは「この初期ロードで画面に載せた最後のメッセージ」。
          // messages はここで組み立て終えた配列そのもので、setState の反映を待たずに
          // 読めるため、送るIDと表示した内容がずれない（newestIDRef を読むと、
          // 直後に走りうる loadNewerMessages やサブスクリプションが書き換えた値を
          // 拾ってしまい、まだ描画していないメッセージまで既読にしかねない）。
          //
          // 未読が25件を超えていて moreAfter が立っている場合、ここで既読にするのは
          // 読み込んだぶんまで。残りはスクロールで追いついたときに既読になる。
          const lastShownID = messages[messages.length - 1]?.ID;
          await markRoomAsRead(roomId, lastShownID).catch(() => {});
        }
      } catch (err) {
        if (!active) return;
        const msg = toUserMessage(err, 'チャットルームの読み込みに失敗しました。時間をおいてから再度お試しください。');
        setState((prev) => ({ ...prev, error: msg }));
      }
    })();

    return () => { active = false; };
  }, [roomId, aroundMessageId]);

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
        // 既読位置は「いま受け取って画面に足したメッセージ」。ここに来るのは
        // hasMoreAfterRef が false のとき（＝末尾を表示している）だけなので、この
        // メッセージが表示済みの最後になる。newMsg.ID を直接渡すのは、state の更新が
        // 非同期で newestIDRef も他の経路が書き換えうるため（読み取った状態と送るIDを
        // ずらさない）。既に表示済みで重複だったとしても、サーバ側の既読位置は
        // 前にしか進まないので実害はない。
        markRoomAsRead(roomId, newMsg.ID).catch(() => {});
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

  // 引用のタップや返信通知からのジャンプ。すでに読み込み済みならスクロールするだけ、
  // まだ読み込んでいない古いメッセージなら around で読み直してから中央に表示する。
  const jumpToMessage = useCallback(async (messageId: string) => {
    if (!roomId) return;
    if (messagesRef.current.some((m) => m.ID === messageId)) {
      setPendingScrollId(messageId);
      return;
    }
    try {
      const result = await listMessages(roomId, AROUND_LIMIT, { around: messageId });
      oldestIDRef.current = result.items[0]?.ID;
      newestIDRef.current = result.items[result.items.length - 1]?.ID;
      setState((prev) => ({ ...prev, messages: result.items }));
      setHasMoreBefore(result.hasMoreBefore);
      setHasMoreAfter(result.hasMoreAfter);
      hasMoreAfterRef.current = result.hasMoreAfter;
      setPendingScrollId(messageId);
    } catch {
      // ジャンプに失敗しても、開いているルームの表示はそのまま維持する
    }
  }, [roomId]);

  const clearPendingScroll = useCallback(() => setPendingScrollId(null), []);

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
    pendingScrollId,
    jumpToMessage,
    clearPendingScroll,
  };
};
