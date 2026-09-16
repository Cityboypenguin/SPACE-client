import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ImageLightbox } from '../../../../components/organisms/ImageLightbox';
import { useNavigate, useLocation } from 'react-router-dom';
import editIcon from '../../../../assets/パーツ_メッセージ編集.svg';
import { type Message, type Media, type ReplyTarget } from '../../api/message';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { Avatar } from '../../../../components/atoms/Avatar';
import { storageUrl } from '../../../../lib/storage';
import { DropdownMenu, DropdownMenuItem } from '../../../../components/molecules/DropdownMenu';
import { ReplyArrow } from '../../../../components/atoms/ReplyArrow';
import { useSwipeToReply } from '../../hooks/useSwipeToReply';
import replyMenuIcon from '../../../../assets/パーツ_コメント.svg';
import deleteIcon from '../../../../assets/パーツ_削除.svg';
import { reservedAspectRatio } from '../../../../lib/media';
import { reportDimensionsOnLoad } from '../../../../lib/reportMediaDimensions';
import styles from '../ChatRoom.module.css';

const URL_REGEX = /(https?:\/\/[^\s 《》「」（）、。！？]+)/g;

// これより長く触れていたら「タップ」ではなく長押しとみなし、メニューを開かない。
// 長押しは OS 標準のテキスト選択（コピー）に使ってもらう。
const TAP_MAX_DURATION_MS = 400;

// マウスではなく指で操作する端末か。長押しやテキスト選択の扱いを分けるのに使う。
const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches;

const renderWithLinks = (text: string) => {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.messageLink}
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      part
    )
  );
};

const getFileIcon = (contentType: string): string => {
  if (contentType.includes('word')) return '📝';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
  if (contentType.includes('zip') || contentType.includes('compressed')) return '🗜️';
  if (contentType.startsWith('video/')) return '🎥';
  if (contentType.startsWith('audio/')) return '🎵';
  return '📎';
};

const MediaList = ({ mediaItems, isMine }: { mediaItems: Media[]; isMine: boolean }) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const images = mediaItems.filter((m) => m.contentType.startsWith('image/'));
  const files = mediaItems.filter((m) => !m.contentType.startsWith('image/'));

  const imageUrls = images.map((m) => storageUrl(m.url));

  return (
    <>
      {images.length > 0 && (
        <div className={[
          styles.messageMediaGrid,
          isMine ? styles.messageMediaGridMine : styles.messageMediaGridTheirs,
          images.length === 1 ? styles.messageMediaGridSingle : styles.messageMediaGridMultiple,
        ].join(' ')}>
          {images.map((m, i) => {
            const url = storageUrl(m.url);
            // 1枚のときだけ高さが縦横比で決まる（複数枚は正方形固定）ので、そこだけ
            // ロード前に領域を確保する。これがないとロード完了時に高さが変わり、
            // 初回表示のスクロール位置がずれる。
            const aspectRatio = images.length === 1 ? reservedAspectRatio(m) : undefined;
            return (
              <img
                key={m.ID}
                src={url}
                alt="添付画像"
                onClick={() => setActiveImageIndex(i)}
                onLoad={reportDimensionsOnLoad(m)}
                className={`${styles.messageImageThumb} ${images.length === 1 ? styles.messageImageSingle : ''}`}
                style={aspectRatio ? { aspectRatio } : undefined}
              />
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <div className={`${styles.messageFileList} ${isMine ? styles.messageFileListMine : styles.messageFileListTheirs}`}>
          {files.map((m) => (
            <a
              key={m.ID}
              href={storageUrl(m.url)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.messageFileLink}
            >
              <div
                className={`${styles.messageFileChip} ${isMine ? styles.mediaFileChipMine : styles.mediaFileChipTheirs}`}
              >
                <span className={styles.messageFileIcon}>{getFileIcon(m.contentType)}</span>
                <span>{m.contentType.split('/')[1]?.toUpperCase() ?? 'FILE'}</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {activeImageIndex !== null && (
        <ImageLightbox
          urls={imageUrls}
          initialIndex={activeImageIndex}
          onClose={() => setActiveImageIndex(null)}
        />
      )}
    </>
  );
};

// 引用返信の返信先プレビュー。LINE と同じくバブルの内側（本文の上）に収め、
// タップで元メッセージへジャンプする。返信先に画像があればサムネイルを右に出す。
// replyTo が null（= 返信先が削除済み）のときは削除表示にし、タップは無効。
const ReplyQuote = ({
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
  const preview = replyTo.content.trim() !== ''
    ? replyTo.content
    : imageCount > 0
      ? `画像${imageCount}件`
      : fileCount > 0
        ? `ファイル${fileCount}件`
        : '';

  return (
    <button
      type="button"
      className={`${styles.replyQuote} ${toneClass}`}
      onClick={() => onJump?.(replyTo.ID)}
    >
      <span className={styles.replyQuoteBody}>
        <span className={styles.replyQuoteName}>{replyTo.isMine ? '自分' : replyTo.user.name}</span>
        <span className={styles.replyQuoteText}>{preview}</span>
      </span>
      {thumbnail && (
        <img src={storageUrl(thumbnail.url)} alt="" className={styles.replyQuoteThumb} />
      )}
    </button>
  );
};

type Props = {
  msg: Message;
  isMine: boolean;
  canDelete: boolean;
  isEditing: boolean;
  editContent: string;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditContentChange: (val: string) => void;
  onDelete: () => void;
  isReadByPartner?: boolean;
  isAnonymousAuthor?: boolean;
  // 引用返信。書き込み不可のルームでは onReply を渡さず返信ボタンを出さない。
  onReply?: () => void;
  onJumpToMessage?: (messageId: string) => void;
  // 書き込み不可のルーム(履修をやめた授業・終了した学期)では自分のメッセージでも編集させない。
  editable?: boolean;
};

export const ChatMessageBubble = ({
  msg, isMine, canDelete, isEditing,
  editContent, onStartEdit, onSaveEdit, onCancelEdit,
  onEditContentChange, onDelete, isReadByPartner, isAnonymousAuthor, editable = true,
  onReply, onJumpToMessage,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasText = msg.content.trim() !== '';
  const hasMedia = msg.media && msg.media.length > 0;
  const canEdit = editable && isMine && msg.content.trim() !== '';
  const canReply = !!onReply && !isEditing;
  const canShowActions = (canEdit || canDelete || canReply) && !isEditing;
  const isReply = !!msg.replyToID;
  const isEdited = new Date(msg.updatedAt).getTime() !== new Date(msg.createdAt).getTime();

  const [menuOpen, setMenuOpen] = useState(false);
  // タップとスクロール／スワイプを見分けるための記録。
  const touchStartedAt = useRef(0);
  const movedDuringTouch = useRef(false);
  // メニューを上下どちらに開くか。一覧の上端・下端で見切れないよう実測して決める。
  const [openUpward, setOpenUpward] = useState(true);
  const menuAnchorRef = useRef<HTMLSpanElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing || !editTextareaRef.current) return;
    const el = editTextareaRef.current;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [isEditing]);

  // 開いた直後に、メニューの実寸とスクロール領域の余白を測って向きを決める。
  // 描画前に確定させたいので useLayoutEffect（useEffect だと一瞬反対側に出る）。
  useLayoutEffect(() => {
    if (!menuOpen) return;
    const anchor = menuAnchorRef.current;
    const dropdown = anchor?.querySelector<HTMLElement>(`.${styles.messageMenuDropdown}`);
    if (!anchor || !dropdown) return;

    const anchorRect = anchor.getBoundingClientRect();
    // 見切れの境界はビューポートではなくメッセージ一覧（スクロール領域）
    const scroller = anchor.closest<HTMLElement>(`.${styles.messageList}`);
    const bounds = scroller
      ? scroller.getBoundingClientRect()
      : { top: 0, bottom: window.innerHeight };
    const needed = dropdown.offsetHeight + 4;
    const roomAbove = anchorRect.top - bounds.top;
    const roomBelow = bounds.bottom - anchorRect.bottom;
    // 上に入るなら上（吹き出しを隠しにくい）。入らないなら広い方へ。
    setOpenUpward(roomAbove >= needed || roomAbove >= roomBelow);
  }, [menuOpen]);

  // DropdownMenu の useClickOutside は mousedown しか見ていないので、
  // タッチ端末での「外側をタップして閉じる」ぶんはここで面倒を見る。
  // メニュー自身へのタッチで閉じてしまうと、項目に click が届く前に
  // アンマウントされて「押せないメニュー」になるので、内側は除外する。
  useEffect(() => {
    if (!menuOpen) return;
    const closeIfOutside = (e: TouchEvent) => {
      const anchor = menuAnchorRef.current;
      if (anchor && e.target instanceof Node && anchor.contains(e.target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('touchstart', closeIfOutside);
    return () => document.removeEventListener('touchstart', closeIfOutside);
  }, [menuOpen]);

  // バブルを内側（画面中央側）へ引くと返信。自分の発言は右寄せなので左へ、
  // 相手の発言は左寄せなので右へ動かす。
  const swipe = useSwipeToReply({
    enabled: canReply,
    direction: isMine ? -1 : 1,
    onReply: () => onReply?.(),
    onMoveBeyondSlop: () => { movedDuringTouch.current = true; },
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartedAt.current = Date.now();
    movedDuringTouch.current = false;
    swipe.handlers.onTouchStart(e);
  };

  // タッチ端末はタップでメニューを開く。長押しは OS 標準のテキスト選択に譲るため、
  // 自前では拾わない。スクロール・スワイプ後や、リンク／画像／引用のタップは除く。
  const handleClick = (e: React.MouseEvent) => {
    if (!canShowActions || !isCoarsePointer()) return;
    if (movedDuringTouch.current) return;
    if (Date.now() - touchStartedAt.current > TAP_MAX_DURATION_MS) return;
    if ((e.target as HTMLElement).closest('a, button, img, textarea')) return;
    setMenuOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!canShowActions) return;
    // ブラウザ標準のメニューではなく、「···」と同じメニューを出す
    e.preventDefault();
    setMenuOpen(true);
  };

  // DropdownMenu 自身の .wrap は position: relative を持つので、浮かせる位置指定は
  // 上書きせず外側の span で行う（同じプロパティをクラス1つ同士で争わせない）。
  const actionMenu = canShowActions && (
    <span
      ref={menuAnchorRef}
      className={`${styles.messageMenu} ${isMine ? styles.messageMenuLeft : styles.messageMenuRight}`}
    >
      <DropdownMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        ariaLabel="メッセージの操作"
        triggerClassName={styles.messageMenuTrigger}
        dropdownClassName={`${styles.messageMenuDropdown} ${openUpward ? styles.messageMenuDropdownUp : styles.messageMenuDropdownDown}`}
      >
        {(close) => (
          <>
            {canReply && (
              <DropdownMenuItem icon={replyMenuIcon} themedIcon onClick={() => { close(); onReply?.(); }}>
                返信
              </DropdownMenuItem>
            )}
            {canEdit && (
              <DropdownMenuItem icon={editIcon} themedIcon onClick={() => { close(); onStartEdit(); }}>
                編集
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem icon={deleteIcon} themedIcon danger onClick={() => { close(); onDelete(); }}>
                削除
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenu>
    </span>
  );

  const bubbleContent = (
    <div className={`${styles.messageBubble} ${isMine ? styles.mine : styles.theirs}`}>
      {/* スワイプで引いたぶんだけ現れる返信アイコン。バブルが退いた側に出す */}
      {swipe.offset !== 0 && (
        <span
          className={`${styles.swipeReplyHint} ${isMine ? styles.swipeReplyHintRight : styles.swipeReplyHintLeft} ${swipe.isReady ? styles.swipeReplyHintReady : ''}`}
          style={{ opacity: swipe.progress }}
          aria-hidden="true"
        >
          <ReplyArrow size={18} />
        </span>
      )}
      {!isMine && (
        <span
          className={styles.senderName}
          onClick={isAnonymousAuthor ? undefined : () => navigate(`/users/${msg.user.ID}`, { state: { from: location.pathname } })}
          style={{ cursor: isAnonymousAuthor ? 'default' : 'pointer' }}
        >
          {msg.user.name}
        </span>
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={swipe.handlers.onTouchEnd}
        onTouchMove={swipe.handlers.onTouchMove}
        onTouchCancel={swipe.handlers.onTouchCancel}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`${styles.messageContentWrap} ${isMine ? styles.messageContentMine : styles.messageContentTheirs}`}
        style={{
          transform: swipe.offset !== 0 ? `translateX(${swipe.offset}px)` : undefined,
          // 指を離したときだけ滑らかに戻す（ドラッグ中は指に追従させる）
          transition: swipe.offset === 0 ? 'transform 0.18s ease-out' : undefined,
        }}
      >
        {actionMenu}
        {isEditing ? (
          <div className={styles.editWrapper}>
            <textarea
              ref={editTextareaRef}
              className={styles.editInput}
              value={editContent}
              rows={1}
              onChange={(e) => {
                onEditContentChange(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { onCancelEdit(); return; }
                const isTouch = window.matchMedia('(pointer: coarse)').matches;
                if (isTouch) return;
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  onSaveEdit();
                }
              }}
              autoFocus
            />
            <div className={styles.editActions}>
              <button className={styles.editSaveBtn} onClick={onSaveEdit}>保存</button>
              <button className={styles.editCancelBtn} onClick={onCancelEdit}>キャンセル</button>
            </div>
            {hasMedia && (
              <div className={styles.editingMediaWrap}>
                <MediaList mediaItems={msg.media} isMine={isMine} />
              </div>
            )}
          </div>
        ) : (
          <>
            {/*
              * 返信のときは、本文が空（画像のみ）でも引用を入れるためにバブルを出す。
              * 返信でない場合の見た目は従来どおり（本文があるときだけバブル）。
              */}
            {isReply ? (
              <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                <ReplyQuote replyTo={msg.replyTo} isMine={isMine} onJump={onJumpToMessage} />
                {hasText && renderWithLinks(msg.content)}
              </div>
            ) : (
              hasText && (
                <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                  {renderWithLinks(msg.content)}
                </div>
              )
            )}
            {hasMedia && <MediaList mediaItems={msg.media} isMine={isMine} />}
          </>
        )}
      </div>

      {isEdited && !isEditing && (
        <span className={styles.editedLabel}>編集済み</span>
      )}
      <span className={styles.timestamp}>
        {new Date(msg.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
      </span>
      {isMine && isReadByPartner && (
        <span className={styles.readReceipt}>既読</span>
      )}
    </div>
  );

  if (isMine) {
    return <div data-message-id={msg.ID} className={styles.messageHighlightTarget}>{bubbleContent}</div>;
  }

  return (
    <div className={`${styles.theirRow} ${styles.messageHighlightTarget}`} data-message-id={msg.ID}>
      {isAnonymousAuthor ? (
        <Avatar name={msg.user.name} size={32} />
      ) : (
        <UserAvatar userId={msg.user.ID} name={msg.user.name} avatarUrl={msg.user.avatarUrl} size={32} />
      )}
      <div className={styles.theirContent}>{bubbleContent}</div>
    </div>
  );
};
