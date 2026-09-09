import { useEffect, useRef, useState } from 'react';
import styles from './ClampedText.module.css';

type Props = {
  text: string;
  maxLines?: number;
  className?: string;
  // 行数を固定せず、親(flexコンテナ)の残り高さいっぱいまで表示し、それでも
  // 入りきらない分だけ「続きを読む」にする(質問詳細の左パネルで使用)。
  fillContainer?: boolean;
  // fillContainer 時、展開/折りたたみの切り替えを親に通知する。親側でパネル全体の
  // overflow を切り替え、展開後はパネルごとスクロールできるようにするために使う。
  onExpandedChange?: (expanded: boolean) => void;
};

// 指定行数(または fillContainer 時は親の残り高さ)を超える場合だけ「続きを読む」
// トグルを出す。縦の長さを一定に保ちつつ、長文でも内容自体は読めるようにする
// (質問本文・回答本文の両方で使う)。
export const ClampedText = ({ text, maxLines = 6, className, fillContainer = false, onExpandedChange }: Props) => {
  // 高さの確保はラッパー側(flex:1)、行クランプは中のpタグ(flex:none, 内容に
  // 応じた高さ)と役割を分ける。pタグ自身をflex:1にすると、行クランプ後も
  // flexが箱を引き伸ばしてしまい、省略記号の後ろに次の行がはみ出して見える
  // バグになるため、使える高さは常にラッパーのclientHeightから測る。
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  // モバイル(CSS側で固定8行クランプにフォールバック)では算出しない。
  const [desktopFillLines, setDesktopFillLines] = useState<number | undefined>(undefined);

  // text が変わったら展開状態をリセットする(レンダー中に直接setStateすることで、
  // リセットのためだけのuseEffectを避ける)。
  const [prevText, setPrevText] = useState(text);
  if (text !== prevText) {
    setPrevText(text);
    setExpanded(false);
  }

  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const p = textRef.current;
    if (!p) return;
    const check = () => {
      if (fillContainer && !expanded && wrap && !window.matchMedia('(max-width: 768px)').matches) {
        const lineHeight = parseFloat(getComputedStyle(p).lineHeight);
        if (lineHeight > 0) {
          // fillContainer では「続きを読む」ボタンも同じラッパー内に出るため、
          // テキストだけで高さを使い切るとボタンが下端で切れてしまう。
          const toggleButtonReserve = 30;
          const availableHeight = Math.max(lineHeight, wrap.clientHeight - toggleButtonReserve);
          setDesktopFillLines(Math.max(1, Math.floor(availableHeight / lineHeight)));
        }
      }
      setOverflowing(p.scrollHeight > p.clientHeight + 1);
    };
    check();
    // fillContainer は親の実高さに依存するため、ウィンドウ幅の変更等でクランプの
    // 要否が変わりうる(固定行数クランプは高さが変わらないので不要)。
    if (!fillContainer || !wrap) return;
    const observer = new ResizeObserver(check);
    observer.observe(wrap);
    return () => observer.disconnect();
    // desktopFillLines: クランプ行数が変わって p の実高さが更新された後、
    // overflowing の判定(scrollHeight/clientHeight比較)をもう一度やり直すため。
  }, [text, maxLines, fillContainer, expanded, desktopFillLines]);

  return (
    <div ref={wrapRef} className={fillContainer ? `${styles.fillWrap} ${expanded ? styles.fillWrapExpanded : ''}` : undefined}>
      <p
        ref={textRef}
        className={`${fillContainer ? `${styles.fillClamp} ${expanded ? styles.fillClampExpanded : ''}` : styles.clamped} ${className ?? ''}`}
        style={{ WebkitLineClamp: expanded ? 'unset' : fillContainer ? desktopFillLines : maxLines }}
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
