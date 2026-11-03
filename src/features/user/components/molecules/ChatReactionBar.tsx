import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { type MessageReaction } from '../../api/message';
import { ReactionGlyph } from '../atoms/ReactionGlyph';
import { reactionLabel } from '../../constants/reactionStamps';
import { refreshChatStamps } from '../../hooks/useChatStamps';
import styles from './ChatReactionBar.module.css';

const MAX_VISIBLE_REACTIONS = 4;

export const ReactionBar = ({
  reactions,
  isMine,
  onToggle,
  allowedEmojis,
}: {
  reactions: MessageReaction[];
  isMine: boolean;
  onToggle?: (emoji: string, reacted: boolean) => void;
  allowedEmojis: string[];
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(0);
  const [open, setOpen] = useState(false);
  // The final reaction may disappear while the dialog is open.
  if (open && reactions.length === 0) setOpen(false);
  useLayoutEffect(() => {
    const row = rowRef.current,
      measure = measureRef.current,
      more = moreRef.current;
    if (!row || !measure || !more) return;
    const calculate = () => {
      const widths = Array.from(measure.children).map(
        (e) => e.getBoundingClientRect().width,
      );
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0,
        available = row.getBoundingClientRect().width;
      if (
        widths.length <= MAX_VISIBLE_REACTIONS &&
        widths.reduce((a, b) => a + b, 0) +
          Math.max(0, widths.length - 1) * gap <=
          available
      ) {
        setVisible(widths.length);
        return;
      }
      let used = more.getBoundingClientRect().width,
        n = 0;
      for (const w of widths.slice(0, MAX_VISIBLE_REACTIONS)) {
        if (used + gap + w > available) break;
        used += gap + w;
        n++;
      }
      setVisible(n);
    };
    const observer = new ResizeObserver(calculate);
    observer.observe(row);
    observer.observe(measure);
    calculate();
    return () => observer.disconnect();
  }, [reactions]);
  useLayoutEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = triggerRef.current;
    dialog.showModal();
    return () => {
      dialog.close();
      trigger?.focus();
    };
  }, [open]);
  const chip = (r: MessageReaction, measuring = false): ReactNode => (
    <button
      key={r.emoji}
      type="button"
      className={`${styles.chip} ${r.reactedByMe ? styles.active : ''}`}
      tabIndex={measuring ? -1 : undefined}
      disabled={
        !onToggle || (!r.reactedByMe && !allowedEmojis.includes(r.emoji))
      }
      aria-pressed={r.reactedByMe}
      aria-label={`${reactionLabel(r.emoji)} ${r.count}件${r.reactedByMe ? '（付けています）' : ''}`}
      onClick={() => {
        onToggle?.(r.emoji, r.reactedByMe);
        void refreshChatStamps();
      }}
    >
      <ReactionGlyph emoji={r.emoji} />
      <span>{r.count > 99 ? '99+' : r.count}</span>
    </button>
  );
  if (reactions.length === 0) return null;
  return (
    <>
      <div
        ref={rowRef}
        className={`${styles.row} ${isMine ? styles.mine : ''}`}
      >
        {reactions.slice(0, visible).map((r) => chip(r))}
        {visible < reactions.length && (
          <button
            ref={triggerRef}
            type="button"
            className={styles.more}
            aria-label={`ほか${reactions.length - visible}種類のリアクションを表示`}
            aria-haspopup="dialog"
            onClick={() => {
              setOpen(true);
              void refreshChatStamps();
            }}
          >
            … +{reactions.length - visible}
          </button>
        )}
        <div className={styles.measure} aria-hidden="true">
          <div ref={measureRef} className={styles.measureRow}>
            {reactions.map((r) => chip(r, true))}
          </div>
          <button ref={moreRef} className={styles.more} tabIndex={-1}>
            … +{reactions.length}
          </button>
        </div>
      </div>
      {open &&
        createPortal(
          <dialog
            aria-label="リアクション一覧"
            ref={dialogRef}
            className={styles.dialog}
            onCancel={() => setOpen(false)}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className={styles.heading}>
              <strong>リアクション</strong>
              <button
                type="button"
                onClick={() => setOpen(false)}
                autoFocus
                aria-label="閉じる"
              >
                閉じる
              </button>
            </div>
            <div className={styles.all}>{reactions.map((r) => chip(r))}</div>
          </dialog>,
          document.body,
        )}
    </>
  );
};
