import { type MessageUser, type ReplyTarget } from '../../api/message';
import { FILES_REMOVED_TEXT } from '../../constants/filesRemoved';
import { reactionLabel } from '../../constants/reactionStamps';
import humanIcon from '../../../../assets/パーツ_人間.svg';
import { storageUrl } from '../../../../lib/storage';
import styles from '../ChatRoom.module.css';

// 引用カードに出す返信先のアイコン。カード全体が <button> なので、<div> を含む
// Avatar / <a> を張る UserAvatar ではなく画像1枚で組む（ボタンの中に置ける要素で
// 収める・引用のタップがプロフィール遷移に化けないようにする、の両方が理由）。
// アイコン未設定の投稿者には既定の人型アイコンが出る。
const ReplyQuoteAvatar = ({ user }: { user: MessageUser }) => {
  const url = storageUrl(user.avatarUrl);
  return (
    <span className={styles.replyQuoteAvatar}>
      <img
        src={url ?? humanIcon}
        alt=""
        className={url ? styles.replyQuoteAvatarImg : styles.replyQuoteAvatarDefault}
      />
    </span>
  );
};

// 引用返信の返信先プレビュー。LINE と同じくバブルの内側（本文の上）に収め、
// タップで元メッセージへジャンプする。返信先に画像があればサムネイルを右に出す。
// replyTo が null（= 返信先が削除済み）のときは削除表示にし、タップは無効。
export const ReplyQuote = ({
  replyTo,
  isMine,
  onJump,
}: {
  replyTo: ReplyTarget | null | undefined;
  isMine: boolean;
  onJump?: (messageId: string) => void;
}) => {
  const toneClass = isMine ? styles.replyQuoteMine : styles.replyQuoteTheirs;

  if (!replyTo) {
    return (
      <div className={`${styles.replyQuote} ${toneClass} ${styles.replyQuoteDeleted}`}>
        <span className={styles.replyQuoteText}>削除されたメッセージ</span>
      </div>
    );
  }

  const thumbnail = replyTo.media.find((m) => m.contentType.startsWith('image/'));
  const fileCount = replyTo.media.filter((m) => !m.contentType.startsWith('image/')).length;
  const imageCount = replyTo.media.length - fileCount;
  const preview = replyTo.stampID
    ? `スタンプ（${reactionLabel(replyTo.stampID)}）`
    : replyTo.content.trim() !== ''
    ? replyTo.content
    : imageCount > 0
      ? `画像${imageCount}件`
      : fileCount > 0
        ? `ファイル${fileCount}件`
        : FILES_REMOVED_TEXT;

  return (
    <button
      type="button"
      className={`${styles.replyQuote} ${toneClass}`}
      onClick={() => onJump?.(replyTo.ID)}
    >
      <span className={styles.replyQuoteBody}>
        {/* 自分の発言への返信でも「自分」ではなく名前を出す（誰への返信かが一目で分かるように） */}
        <span className={styles.replyQuoteHeader}>
          <ReplyQuoteAvatar user={replyTo.user} />
          <span className={styles.replyQuoteName}>{replyTo.user.name}</span>
        </span>
        <span className={styles.replyQuoteText}>{preview}</span>
      </span>
      {thumbnail && (
        <img src={storageUrl(thumbnail.url)} alt="" className={styles.replyQuoteThumb} />
      )}
    </button>
  );
};
