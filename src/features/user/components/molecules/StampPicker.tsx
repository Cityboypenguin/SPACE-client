import { useEffect, useRef, useState } from 'react';
import { useClickOutside } from '../../../../hooks/useClickOutside';
import { ReactionGlyph } from '../atoms/ReactionGlyph';
import { reactionLabel } from '../../constants/reactionStamps';
import styles from '../ChatRoom.module.css';

type Props = {
  // 送れるスタンプのID（サーバーの許可リストのうち、スタンプのもの）。
  stamps: string[];
  onPick: (stampID: string) => void;
  disabled?: boolean;
};

// 入力欄の横のボタン。押すとスタンプの一覧が開き、1つ選ぶとそのスタンプだけを
// メッセージとして送る（本文は無い）。
export const StampPicker = ({ stamps, onPick, disabled }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // 一覧を開いたら最初のスタンプへフォーカスを移す（キーボードで続けて選べるように）。
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [open]);

  // 閉じるときは、フォーカスをこのボタンへ戻す（押したスタンプのボタンが消えてもフォーカスを見失わない）。
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      className={styles.stampPickerWrap}
      ref={ref}
      onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); close(); } }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-expanded={open}
        title="スタンプを送る"
        aria-label="スタンプを送る"
        className={`${styles.attachButton} ${disabled ? styles.attachBtnDisabled : styles.attachBtnEnabled} ${styles.stampPickerButton}`}
      >
        <span aria-hidden="true">😊</span>
      </button>
      {open && (
        <div ref={panelRef} className={styles.stampPickerPanel} role="group" aria-label="送るスタンプを選ぶ">
          {stamps.map((id) => (
            <button
              key={id}
              type="button"
              aria-label={`${reactionLabel(id)}を送る`}
              className={styles.reactionPickerButton}
              onClick={() => { close(); onPick(id); }}
            >
              <ReactionGlyph emoji={id} compact />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
