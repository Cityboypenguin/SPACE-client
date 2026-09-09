import { useCallback, useEffect, useRef, useState } from 'react';
import { type Message } from '../api/message';
import { storageUrl } from '../../../lib/storage';

// スクロール制御のための可変値。描画には使わないが、ルームを切り替えたら必ず初期状態に
// 戻す必要がある（前のルームの「初回スクロール済み」や「既読件数」を引き継ぐと、
// 新しいルームで初期スクロールが走らない・未読バッジが誤った件数になる）。
type RoomScrollState = {
  /** そのルームでの初回スクロール（未読位置 or 最下部）が完了したか */
  initialScrolled: boolean;
  /** 最下部を表示中か */
  atBottom: boolean;
  /** ユーザーが目にしたとみなせるメッセージ件数 */
  seenCount: number;
  /** 末尾メッセージ ID。プリペンド（過去の読み込み）とアペンド（新着）の区別に使う */
  lastTailId: string | undefined;
};

const createRoomScrollState = (): RoomScrollState => ({
  initialScrolled: false,
  atBottom: false,
  seenCount: 0,
  lastTailId: undefined,
});

// 自分の発言かどうかは Message.isMine が持つため、閲覧者の ID は受け取らない。
export const useChatScroll = (messages: Message[], roomId?: string, hasMoreAfter?: boolean) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);

  // ルームに紐づく可変状態は「どのルームのものか」ごと保持し、参照時に roomId のズレを見て
  // 作り直す。リセットをレンダー中の副作用ではなく参照時の遅延初期化にすることで、
  // 破棄されたレンダーでリセットだけが適用される事故が起きない。getRoomState() は
  // 常に effect / イベントハンドラの中から呼ぶこと（レンダー中に呼んではいけない）。
  const roomStateRef = useRef<{ roomId: string | undefined; state: RoomScrollState } | null>(null);
  // roomId が変わったときだけ関数の同一性が変わるため、これを依存に含めた effect は
  // ルーム切り替えで必ず再実行される。
  const getRoomState = useCallback((): RoomScrollState => {
    if (!roomStateRef.current || roomStateRef.current.roomId !== roomId) {
      roomStateRef.current = { roomId, state: createRoomScrollState() };
    }
    return roomStateRef.current.state;
  }, [roomId]);

  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // 表示に使う state のルーム切り替えリセット。レンダー中の setState は
  // 「props の変化に合わせて state を調整する」React 公式のパターンで、コミット前に
  // 再レンダーされるため、切り替え直後に前のルームのバッジが一瞬見えることがない。
  const [renderedRoomId, setRenderedRoomId] = useState(roomId);
  if (renderedRoomId !== roomId) {
    setRenderedRoomId(roomId);
    setNewMessageCount(0);
    setIsAtBottom(false);
  }

  // 未読があれば未読の先頭へ、なければ最下部へ寄せる
  const scrollToInitialPosition = useCallback(() => {
    if (firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, []);

  // 初回表示。画像の高さが確定する前にスクロールすると位置がずれるため、
  // 初回取得分に含まれる画像のロード完了を待ってから位置を決める。
  useEffect(() => {
    const roomState = getRoomState();
    if (messages.length === 0 || roomState.initialScrolled) return;

    roomState.seenCount = messages.length;
    roomState.lastTailId = messages[messages.length - 1]?.ID;

    const initialImageUrls = messages
      .flatMap((msg) => msg.media ?? [])
      .filter((media) => media.contentType.startsWith('image/'))
      .map((media) => storageUrl(media.url));

    if (initialImageUrls.length === 0) {
      scrollToInitialPosition();
      roomState.initialScrolled = true;
      return;
    }

    let cancelled = false;

    void Promise.all(
      initialImageUrls.map(
        (url) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.src = url;
            // ロード成功・失敗どちらでも先に進める（失敗した画像で待ち続けない）
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    ).then(() => {
      // ロード中にルームが切り替わった場合は、新しいルームの表示を動かさない
      if (cancelled || roomState.initialScrolled) return;
      scrollToInitialPosition();
      roomState.initialScrolled = true;
    });

    return () => {
      cancelled = true;
    };
  }, [messages, getRoomState, scrollToInitialPosition]);

  // 最下部の可視判定。初回スクロールが終わるまでは、途中経過の位置を
  // 「ユーザーが最下部を見ている」と誤認しないよう無視する。
  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const roomState = getRoomState();
        if (!roomState.initialScrolled) return;
        const atBottom = entry.isIntersecting;
        roomState.atBottom = atBottom;
        setIsAtBottom(atBottom);
        if (atBottom) {
          roomState.seenCount = messages.length;
          setNewMessageCount(0);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [messages.length, getRoomState]);

  // 末尾に新着が追加されたときのみ処理（プリペンドはスキップ）
  // - 歴史閲覧中（hasMoreAfter=true）はページング中のためスクロール抑制
  // - 一番下を見ているとき、または自分のメッセージなら自動スクロール
  // - それ以外は未読バッジをインクリメント
  useEffect(() => {
    const roomState = getRoomState();
    if (!roomState.initialScrolled || messages.length === 0) return;

    const tail = messages[messages.length - 1];
    if (!tail) return;

    // 末尾 ID が変わっていない = 上方向のプリペンドのみ → スクロール不要
    if (tail.ID === roomState.lastTailId) return;
    roomState.lastTailId = tail.ID;

    if (hasMoreAfter) {
      const unseen = messages.length - roomState.seenCount;
      setNewMessageCount(unseen > 0 ? unseen : 0);
      return;
    }

    if (roomState.atBottom || tail.isMine) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      roomState.seenCount = messages.length;
      setNewMessageCount(0);
    } else {
      const unseen = messages.length - roomState.seenCount;
      setNewMessageCount(unseen > 0 ? unseen : 0);
    }
  }, [messages, hasMoreAfter, getRoomState]);

  const scrollToLatest = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    getRoomState().seenCount = messages.length;
    setNewMessageCount(0);
  }, [getRoomState, messages.length]);

  return {
    bottomRef,
    firstUnreadRef,
    newMessageCount,
    isAtBottom,
    scrollToLatest,
    scrollToInitialPosition,
  };
};
