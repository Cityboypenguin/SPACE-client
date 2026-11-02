import { type MessageReaction } from '../../api/message';
import { ReactionGlyph } from '../atoms/ReactionGlyph';
import { isStampReaction, reactionLabel } from '../../constants/reactionStamps';
import styles from '../ChatRoom.module.css';

// 吹き出しの下に並べる、絵文字ごとのリアクションの集計。押すと自分のリアクションを付け外しする。
// onToggle が無いとき（書き込み不可のルーム）は集計を見せるだけで押せない。
export const ReactionBar = ({
  reactions,
  isMine,
  onToggle,
  allowedEmojis,
}: {
  reactions: MessageReaction[];
  isMine: boolean;
  onToggle?: (emoji: string, reacted: boolean) => void;
  // いま付けてよい絵文字・スタンプ。ここに無いもの（一覧から抜かれたもの）は、
  // すでに付けた本人は外せるが、他の人が新しく付けることはできない。
  allowedEmojis: string[];
}) => {
  if (reactions.length === 0) return null;
  return (
    <div className={`${styles.reactionBar} ${isMine ? styles.reactionBarMine : styles.reactionBarTheirs}`}>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          disabled={!onToggle || (!r.reactedByMe && !allowedEmojis.includes(r.emoji))}
          aria-pressed={r.reactedByMe}
          aria-label={`${reactionLabel(r.emoji)} ${r.count}件${r.reactedByMe ? '（付けています）' : ''}`}
          className={`${styles.reactionChip} ${isStampReaction(r.emoji) ? styles.reactionChipStamp : ''} ${r.reactedByMe ? styles.reactionChipActive : ''}`}
          onClick={() => onToggle?.(r.emoji, r.reactedByMe)}
        >
          <ReactionGlyph emoji={r.emoji} />
          <span className={styles.reactionCount}>{r.count}</span>
        </button>
      ))}
    </div>
  );
};
