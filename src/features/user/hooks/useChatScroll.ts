import { useEffect, useRef, useState } from 'react';
import { type Message } from '../api/message';

export const useChatScroll = (
  messages: Message[],
  currentUserID: string | null | undefined,
  roomId?: string,
  hasMoreAfter?: boolean
) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);

  // 初回表示完了フラグ
  const initialScrolledRef = useRef(false);

  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const isAtBottomRef = useRef(false);
  const seenCountRef = useRef(0);
  const lastKnownTailIdRef = useRef<string | undefined>(undefined);
  const prevRoomIdRef = useRef<string | undefined>(roomId);

  // ルーム切り替え時に状態を完全初期化
  if (prevRoomIdRef.current !== roomId) {
    prevRoomIdRef.current = roomId;
    initialScrolledRef.current = false;
    isAtBottomRef.current = false;
    seenCountRef.current = 0;
    lastKnownTailIdRef.current = undefined;
    if (newMessageCount !== 0) {
      setNewMessageCount(0);
    }
  }

  // 1. 最下部スクロール（状況に応じて未読位置か最下部かを判定）
  const scrollToInitialPosition = () => {
    if (firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  };

  // 2. 初回メッセージ読み込み時のスクロール決定（1度だけ実行）
  useEffect(() => {
    if (messages.length === 0 || initialScrolledRef.current) return;

    seenCountRef.current = messages.length;
    lastKnownTailIdRef.current = messages[messages.length - 1]?.ID;

    // DOM描画タイミングに合わせてスクロール実行
    scrollToInitialPosition();
    initialScrolledRef.current = true;
  }, [messages]);

  // 3. 最下部領域の交差検知（初回スクロール完了後のみ有効）
  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!initialScrolledRef.current) return;
        const atBottom = entry.isIntersecting;
        isAtBottomRef.current = atBottom;
        setIsAtBottom(atBottom);
        if (atBottom) {
          seenCountRef.current = messages.length;
          setNewMessageCount(0);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [messages.length]);

  // 4. リアルタイムでメッセージが追加された時の処理
  useEffect(() => {
    // 初回スクロールが完了していない、またはメッセージがない場合は何もしない
    if (!initialScrolledRef.current || messages.length === 0) return;

    const tail = messages[messages.length - 1];
    if (!tail) return;

    // 取得メッセージの末尾が変わっていない（初回データや過去ログ読み込み）場合はスキップ
    if (tail.ID === lastKnownTailIdRef.current) return;
    lastKnownTailIdRef.current = tail.ID;

    // 未来のメッセージがある場合はバッジのみ更新
    if (hasMoreAfter) {
      const unseen = messages.length - seenCountRef.current;
      setNewMessageCount(unseen > 0 ? unseen : 0);
      return;
    }

    if (isAtBottomRef.current || (currentUserID && tail.user.ID === currentUserID)) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      seenCountRef.current = messages.length;
      setNewMessageCount(0);
    } else {
      const unseen = messages.length - seenCountRef.current;
      setNewMessageCount(unseen > 0 ? unseen : 0);
    }
  }, [messages, currentUserID, hasMoreAfter]);

  const scrollToLatest = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    seenCountRef.current = messages.length;
    setNewMessageCount(0);
  };

  return {
    bottomRef,
    firstUnreadRef,
    newMessageCount,
    isAtBottom,
    scrollToLatest,
    scrollToInitialPosition,
  };
};