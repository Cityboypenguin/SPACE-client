import { useEffect, useRef, useState } from 'react';
import { type Message } from '../api/message';

export const useChatScroll = (messages: Message[], currentUserID: string | null | undefined, roomId?: string, hasMoreAfter?: boolean) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const isAtBottomRef = useRef(false);
  const seenCountRef = useRef(0);
  // 末尾メッセージIDを記録し、プリペンド（古いメッセージの先頭追加）とアペンド（新着）を区別する
  const lastKnownTailIdRef = useRef<string | undefined>(undefined);

  // ルーム切り替え時にスクロール状態をリセット
  useEffect(() => {
    setHasScrolled(false);
    seenCountRef.current = 0;
    lastKnownTailIdRef.current = undefined;
    setNewMessageCount(0);
  }, [roomId]);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const atBottom = entry.isIntersecting;
        isAtBottomRef.current = atBottom;
        setIsAtBottom(atBottom);
        if (atBottom) {
          seenCountRef.current = messages.length;
          setNewMessageCount(0);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [messages.length]);

  // 初回ロード時: 未読がある場合は未読箇所へ、なければ最下部へスクロール
  useEffect(() => {
    if (messages.length === 0 || hasScrolled) return;
    seenCountRef.current = messages.length;
    lastKnownTailIdRef.current = messages[messages.length - 1]?.ID;
    if (firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
    setHasScrolled(true);
  }, [messages.length, hasScrolled]);

  // 末尾に新着が追加されたときのみ処理（プリペンドはスキップ）
  // - 歴史閲覧中（hasMoreAfter=true）はページング中のためスクロール抑制
  // - 一番下を見ているとき、または自分のメッセージなら自動スクロール
  // - それ以外は未読バッジをインクリメント
  useEffect(() => {
    if (!hasScrolled || messages.length === 0) return;
    const tail = messages[messages.length - 1];
    // 末尾IDが変わっていない = 上方向プリペンドのみ → スクロール不要
    if (tail.ID === lastKnownTailIdRef.current) return;
    lastKnownTailIdRef.current = tail.ID;

    // 歴史閲覧中（loadNewer でアペンドされた）はスクロールせずバッジだけ更新
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
  }, [messages.length, hasScrolled, currentUserID, hasMoreAfter]);

  const scrollToLatest = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    seenCountRef.current = messages.length;
    setNewMessageCount(0);
  };

  return { bottomRef, firstUnreadRef, newMessageCount, isAtBottom, scrollToLatest };
};
