import { useState, type CSSProperties } from 'react';
import { findStamp, isStampReaction } from '../../constants/reactionStamps';
import styles from './ReactionGlyph.module.css';

// リアクション1つぶんの見た目。絵文字はそのまま、"stamp:" のIDはスタンプとして描く
// （画像が定義されていれば画像、無ければ文字スタンプ）。
// リアクションを表示する場所（チップ・一覧）は全部この部品を通しているので、
// 見た目を変えるときはここだけ直せばよい。
// compact は選択の一覧用。チップより少し小さく出して、一覧が画面からはみ出さないようにする。
// large はスタンプ単体のメッセージ用。チップより大きく出す。
// 大きさ: チップ(既定)=定義の高さの0.8倍、一覧(compact)=0.72倍、スタンプ単体(large)=2.4倍。
export const ReactionGlyph = ({ emoji, compact = false, large = false }: { emoji: string; compact?: boolean; large?: boolean }) => {
  // 画像が読み込めなかった（ファイルが無い・壊れている）ときは、文字スタンプに切り替える。
  const [imageFailed, setImageFailed] = useState(false);

  if (!isStampReaction(emoji)) {
    return <span aria-hidden="true">{emoji}</span>;
  }

  const stamp = findStamp(emoji);
  if (stamp?.image && !imageFailed) {
    return (
      <img
        src={stamp.image}
        alt=""
        aria-hidden="true"
        className={styles.stampImage}
        draggable={false}
        style={stamp.imageHeight ? { height: `${Math.round(stamp.imageHeight * (compact ? 0.72 : large ? 2.4 : 0.8))}px` } : undefined}
        onError={() => setImageFailed(true)}
      />
    );
  }

  // 画面がまだ知らないスタンプ（サーバーだけ先に増えた場合）は、無地のラベルで出す。
  return (
    <span
      aria-hidden="true"
      className={`${styles.stamp} ${large ? styles.stampLarge : ''}`}
      style={stamp ? ({ '--stamp-color': stamp.color, '--stamp-tilt': `${stamp.tilt}deg` } as CSSProperties) : undefined}
    >
      {stamp?.label ?? 'スタンプ'}
    </span>
  );
};
