import { Link, useNavigate } from 'react-router-dom';
import { DELETED_ACCOUNT_ID, type Message } from '../../../user/api/message';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { ReactionGlyph } from '../../../user/components/atoms/ReactionGlyph';
import { MediaList } from '../../../user/components/molecules/ChatMessageMedia';
import { ReplyQuote } from '../../../user/components/molecules/ChatReplyQuote';
import { ReactionBar } from '../../../user/components/molecules/ChatReactionBar';
import { FILES_REMOVED_TEXT } from '../../../user/constants/filesRemoved';
import { renderChatText } from '../../../../lib/renderTextWithLinks';
import chatStyles from '../../../user/components/ChatRoom.module.css';
import styles from './AdminChatMessage.module.css';

type Props = {
  msg: Message;
  onDelete: () => void;
  deleting?: boolean;
  onOpenThread: (roomID: string) => void;
  onJumpToMessage: (messageID: string) => void;
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

// ユーザー側の吹き出し（ChatMessageBubble）と同じ見た目で、管理者に要る情報を足したもの。
// 管理者は誰の発言でもないので、全員を「相手」側（左寄せ）で出し、まとめずに毎回名前を出す。
export const AdminChatMessage = ({ msg, onDelete, deleting = false, onOpenThread, onJumpToMessage }: Props) => {
  const navigate = useNavigate();
  const isThread = !!msg.thread;
  const isStamp = !isThread && !!msg.stampID;
  const hasText = (msg.thread?.title ?? msg.content).trim() !== '';
  const hasMedia = msg.media && msg.media.length > 0;
  const filesRemoved = !isStamp && !hasText && !hasMedia;
  const isReply = !isThread && !!msg.replyToID;
  const isEdited = !isThread && new Date(msg.updatedAt).getTime() !== new Date(msg.createdAt).getTime();
  const isWithdrawn = msg.user.accountID === DELETED_ACCOUNT_ID;
  const bubbleClass = `${chatStyles.bubble} ${chatStyles.bubbleTheirs}`;

  const body = renderChatText({
    text: msg.content,
    linkClassName: chatStyles.messageLink,
    mentions: msg.mentions,
    onMentionClick: (userID) => navigate(`/admin/users/${userID}`),
    stopPropagation: true,
  });

  return (
    <div
      className={`${chatStyles.theirRow} ${chatStyles.messageHighlightTarget} ${chatStyles.messageGroupStart}`}
      data-message-id={msg.ID}
    >
      <UserAvatar
        userId={msg.user.ID}
        name={msg.user.name}
        avatarUrl={msg.user.avatarUrl}
        size={32}
        basePath="/admin/users"
        useMyPageForCurrentUser={false}
      />
      <div className={chatStyles.theirContent}>
        <div className={`${chatStyles.messageBubble} ${chatStyles.theirs}`}>
          <div className={styles.senderLine}>
            {isWithdrawn ? (
              <span className={styles.senderName}>{msg.user.name}</span>
            ) : (
              <Link to={`/admin/users/${msg.user.ID}`} className={styles.senderName}>
                {msg.user.name}
              </Link>
            )}
            <span className={styles.accountID}>@{msg.user.accountID}</span>
            {isWithdrawn && <span className={styles.withdrawn}>退会済み</span>}
          </div>

          <div className={`${chatStyles.messageRow} ${chatStyles.messageRowTheirs}`}>
            <div className={`${chatStyles.messageContentWrap} ${chatStyles.messageContentTheirs}`}>
              {isStamp ? (
                <div className={`${chatStyles.stampMessage} ${chatStyles.stampMessageTheirs}`}>
                  {isReply && (
                    <div className={bubbleClass}>
                      <ReplyQuote replyTo={msg.replyTo} isMine={false} onJump={onJumpToMessage} />
                    </div>
                  )}
                  <ReactionGlyph emoji={msg.stampID!} large />
                </div>
              ) : isReply ? (
                <div className={bubbleClass}>
                  <ReplyQuote replyTo={msg.replyTo} isMine={false} onJump={onJumpToMessage} />
                  {hasText && body}
                  {filesRemoved && <span className={chatStyles.filesRemoved}>{FILES_REMOVED_TEXT}</span>}
                </div>
              ) : hasText ? (
                <div className={bubbleClass}>{msg.thread ? msg.thread.title : body}</div>
              ) : (
                filesRemoved && (
                  <div className={bubbleClass}>
                    <span className={chatStyles.filesRemoved}>{FILES_REMOVED_TEXT}</span>
                  </div>
                )
              )}
              {hasMedia && <MediaList mediaItems={msg.media} isMine={false} />}
            </div>
          </div>

          {!isThread && msg.reactions.length > 0 && (
            <div className={chatStyles.messageReactions}>
              {/* 管理者は付け外ししない。集計だけ出す */}
              <ReactionBar reactions={msg.reactions} isMine={false} allowedEmojis={[]} />
            </div>
          )}

          {msg.thread && (
            <div className={chatStyles.threadBranch}>
              <button
                type="button"
                className={chatStyles.threadCard}
                aria-label={`スレッド「${msg.thread.title}」を開く`}
                onClick={() => onOpenThread(msg.thread!.roomID)}
              >
                <span className={chatStyles.threadCardTop}>
                  <strong>{msg.thread.title}</strong>
                  <span>{msg.thread.messageCount ?? 0}件のメッセージ <span aria-hidden="true">›</span></span>
                </span>
                <span className={chatStyles.threadCardHint}>
                  {msg.thread.isClosed ? 'クローズ済み · ' : ''}スレッドを開く <span aria-hidden="true">→</span>
                </span>
              </button>
            </div>
          )}

          <div className={styles.meta}>
            <time dateTime={msg.createdAt}>{formatDateTime(msg.createdAt)}</time>
            {isEdited && <span>編集済み（{formatDateTime(msg.updatedAt)}）</span>}
            {isStamp && <span>スタンプ</span>}
            {/* スレッドの案内は消すと親チャットから辿れなくなるので、削除の対象にしない */}
            {!isThread && (
              <button type="button" className={styles.deleteButton} onClick={onDelete} disabled={deleting}>
                {deleting ? '削除中…' : '削除'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
