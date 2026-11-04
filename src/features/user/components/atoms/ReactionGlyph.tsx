import { useState } from 'react';
import { findStamp, isStampReaction } from '../../constants/reactionStamps';
import { useChatStamps } from '../../hooks/useChatStamps';
import { storageUrl } from '../../../../lib/storage';
import styles from './ReactionGlyph.module.css';

export const ReactionGlyph = ({
  emoji,
  compact = false,
  large = false,
}: {
  emoji: string;
  compact?: boolean;
  large?: boolean;
}) => {
  useChatStamps();
  const [failedUrl, setFailedUrl] = useState('');
  if (!isStampReaction(emoji)) return <span aria-hidden="true">{emoji}</span>;
  const stamp = findStamp(emoji);
  const size = large
    ? ({ small: 72, standard: 112, large: 160 }[
        stamp?.displaySize ?? 'standard'
      ] ?? 112)
    : compact
      ? 48
      : 20;
  return stamp?.imageUrl && failedUrl !== stamp.imageUrl ? (
    <img
      src={storageUrl(stamp.imageUrl)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={styles.stampImage}
      style={{ width: large ? size * 1.5 : compact ? 64 : 32, height: size }}
      onError={() => setFailedUrl(stamp.imageUrl)}
    />
  ) : (
    <span
      aria-hidden="true"
      className={`${styles.stamp} ${large ? styles.stampLarge : ''}`}
    >
      {stamp?.label ?? 'スタンプ'}
    </span>
  );
};
