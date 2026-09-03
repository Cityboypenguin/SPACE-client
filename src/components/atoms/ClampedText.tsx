import { useEffect, useRef, useState } from 'react';
import styles from './ClampedText.module.css';

type Props = {
  text: string;
  maxLines?: number;
  className?: string;
};

// 指定行数を超える場合だけ「続きを読む」トグルを出す。縦の長さを一定に保ちつつ、
// 長文でも内容自体は読めるようにする(質問本文・回答本文の両方で使う)。
export const ClampedText = ({ text, maxLines = 6, className }: Props) => {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  // text が変わったら展開状態をリセットする(レンダー中に直接setStateすることで、
  // リセットのためだけのuseEffectを避ける)。
  const [prevText, setPrevText] = useState(text);
  if (text !== prevText) {
    setPrevText(text);
    setExpanded(false);
  }

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text, maxLines]);

  return (
    <div>
      <p
        ref={textRef}
        className={`${styles.clamped} ${className ?? ''}`}
        style={{ WebkitLineClamp: expanded ? 'unset' : maxLines }}
      >
        {text}
      </p>
      {(overflowing || expanded) && (
        <button type="button" className={styles.toggleButton} onClick={() => setExpanded((v) => !v)}>
          {expanded ? '閉じる' : '続きを読む'}
        </button>
      )}
    </div>
  );
};
