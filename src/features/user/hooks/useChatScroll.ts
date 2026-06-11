import { useEffect, useRef, useState } from 'react';
import { type Message } from '../api/message';

export const useChatScroll = (messages: Message[], currentUserID: string | null | undefined) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const isAtBottomRef = useRef(false);
  const seenCountRef = useRef(0);

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
    if (firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
    setHasScrolled(true);
  }, [messages, hasScrolled]);

  // 初回スクロール後に届いた新着メッセージ数を計算
  useEffect(() => {
    if (!hasScrolled) return;
    const unseen = messages.length - seenCountRef.current;
    setNewMessageCount(unseen > 0 ? unseen : 0);
  }, [messages.length, hasScrolled]);

  // 一番下を見ているときに新着メッセージが来たら自動スクロール
  useEffect(() => {
    if (!hasScrolled || messages.length === 0) return;
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      seenCountRef.current = messages.length;
      setNewMessageCount(0);
    }
  }, [messages.length, hasScrolled]);

  // 自分が送信したメッセージは最下部へ自動スクロール
  useEffect(() => {
    if (!hasScrolled || messages.length === 0 || !currentUserID) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.user.ID === currentUserID) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      seenCountRef.current = messages.length;
      setNewMessageCount(0);
    }
  }, [messages.length, hasScrolled, currentUserID]);

  const scrollToLatest = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    seenCountRef.current = messages.length;
    setNewMessageCount(0);
  };

  return { bottomRef, firstUnreadRef, newMessageCount, isAtBottom, scrollToLatest };
};
