import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ThreadCard } from './ThreadCard';
import { useNavigate, useLocation } from 'react-router-dom';
import editIcon from '../../../../assets/パーツ_メッセージ編集.svg';
import { type Message } from '../../api/message';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { ReactionGlyph } from '../atoms/ReactionGlyph';
import { refreshChatStamps } from '../../hooks/useChatStamps';
import { reactionLabel } from '../../constants/reactionStamps';
import {
  DropdownMenu,
  DropdownMenuItem,
} from '../../../../components/molecules/DropdownMenu';
import { ReplyArrow } from '../../../../components/atoms/ReplyArrow';
import { useSwipeToReply } from '../../hooks/useSwipeToReply';
import replyMenuIcon from '../../../../assets/パーツ_コメント.svg';
import deleteIcon from '../../../../assets/パーツ_削除.svg';
import reportIcon from '../../../../assets/パーツ_通報.svg';
import styles from '../ChatRoom.module.css';
import { renderChatText } from '../../../../lib/renderTextWithLinks';
import { useMentionNavigation } from '../../hooks/useMentionNavigation';
import { MediaList } from './ChatMessageMedia';
import { FILES_REMOVED_TEXT } from '../../constants/filesRemoved';
import { ReplyQuote } from './ChatReplyQuote';
import { ReactionBar } from './ChatReactionBar';
import { StampCatalogNotice } from './StampCatalogNotice';

// これより長く触れていたら「タップ」ではなく長押しとみなし、メニューを開かない。
// 長押しは OS 標準のテキスト選択（コピー）に使ってもらう。
const TAP_MAX_DURATION_MS = 400;

// マウスではなく指で操作する端末か。長押しやテキスト選択の扱いを分けるのに使う。
const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches;

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
  // 引用返信。書き込み不可のルームでは onReply を渡さず返信ボタンを出さない。
  onReply?: () => void;
  // 相手のメッセージの通報。自分のメッセージには出さない。
  onReport?: () => void;
  onJumpToMessage?: (messageId: string) => void;
  // 書き込み不可のルーム(履修をやめた授業・終了した学期)では自分のメッセージでも編集させない。
  editable?: boolean;
  // 同じ人が同じ分に続けて投稿したメッセージのまとまり（LINE 方式）における位置。
  // 先頭だけアイコンと名前を出し、末尾だけ時刻を出す。渡されなければ単独扱い。
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
  // リアクション。reactionEmojis はサーバーが許す絵文字、onToggleReaction は付け外し
  // （reacted は押す前に自分が付けていたか）。書き込み不可のルームでは onToggleReaction
  // を渡さず、集計の表示だけにする。
  reactionEmojis?: string[];
  onToggleReaction?: (emoji: string, reacted: boolean) => void;
};

export const ChatMessageBubble = ({
  msg,
  isMine,
  canDelete,
  isEditing,
  editContent,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditContentChange,
  onDelete,
  isReadByPartner,
  editable = true,
  onReply,
  onReport,
  onJumpToMessage,
  isGroupStart = true,
  isGroupEnd = true,
  reactionEmojis = [],
  onToggleReaction,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUserID, onMentionClick } = useMentionNavigation();
  const isThread = !!msg.thread;
  // スタンプだけのメッセージ。本文・添付は無く、吹き出しなしでスタンプを大きく出す。
  const isStamp = !isThread && !!msg.stampID;
  const hasText = (msg.thread?.title ?? msg.content).trim() !== '';
  const hasMedia = msg.media && msg.media.length > 0;
  // 本文も添付も無いメッセージは送れない。それでも空なのは、添付を上げた人が
  // 退会して個人情報ごと消されたか、管理者が画像を消して、添付だけが無くなったとき。
  const filesRemoved = !isStamp && !hasText && !hasMedia;
  const canEdit =
    !isThread && editable && isMine && !isStamp && msg.content.trim() !== '';
  const canReply = !isThread && !!onReply && !isEditing;
  const canReport = !isThread && !!onReport && !isMine && !isEditing;
  const reactions = msg.reactions ?? [];
  const canReact = !isThread && !!onToggleReaction && reactionEmojis.length > 0;
  const hasMessageMenu =
    !isThread && (canEdit || canDelete || canReply || canReport) && !isEditing;
  const canShowActions = hasMessageMenu || (canReact && !isEditing);
  const isReply = !isThread && !!msg.replyToID;
  const isEdited =
    !isThread &&
    new Date(msg.updatedAt).getTime() !== new Date(msg.createdAt).getTime();

  // チャット本文の描画。URL とメンションだけを扱う（ハッシュタグは renderChatText 側で対象外）。
  const renderMessageBody = (text: string) =>
    renderChatText({
      text,
      linkClassName: styles.messageLink,
      mentions: msg.mentions,
      currentUserID,
      onMentionClick,
      stopPropagation: true,
    });

  const [menuOpen, setMenuOpen] = useState(false);
  // 通常の操作メニューと、隣のリアクション一覧は同時には開かない。
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  // メニューを開くときは、必ず通常のメニュー（返信・編集・削除）から始める。
  const handleMenuOpenChange = (next: boolean) => {
    if (next) setReactionPickerOpen(false);
    setMenuOpen(next);
  };
  // タップとスクロール／スワイプを見分けるための記録。
  const touchStartedAt = useRef(0);
  const movedDuringTouch = useRef(false);
  // メニューをどちらへ開くか。一覧の端で見切れないよう、上下・左右とも実測して決める。
  const [openUpward, setOpenUpward] = useState(true);
  // 絵文字の一覧を開いたときの、一覧の最大の高さ(px)。メッセージ一覧の端からはみ出さないよう、実際の空きから決める。
  const [pickerMaxHeight, setPickerMaxHeight] = useState<number | undefined>(
    undefined,
  );
  const [alignStart, setAlignStart] = useState(true);
  const menuAnchorRef = useRef<HTMLSpanElement>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);
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
    const dropdown = anchor?.querySelector<HTMLElement>(
      `.${styles.messageMenuDropdown}`,
    );
    if (!anchor || !dropdown) return;

    const scroller = anchor.closest<HTMLElement>(`.${styles.messageList}`);
    const updatePlacement = () => {
      // Each dropdown is positioned relative to its own trigger, not the whole action strip.
      const triggerRect = dropdown.parentElement!.getBoundingClientRect();
      const scrollBounds = scroller?.getBoundingClientRect();
      const bounds = {
        top: Math.max(0, scrollBounds?.top ?? 0),
        bottom: Math.min(
          window.innerHeight,
          scrollBounds?.bottom ?? window.innerHeight,
        ),
        left: Math.max(0, scrollBounds?.left ?? 0),
        right: Math.min(
          window.innerWidth,
          scrollBounds?.right ?? window.innerWidth,
        ),
      };
      const margin =
        parseFloat(getComputedStyle(document.documentElement).fontSize) / 2;
      const chrome = getComputedStyle(dropdown);
      const borderWidth =
        parseFloat(chrome.borderLeftWidth) +
        parseFloat(chrome.borderRightWidth);
      anchor.style.setProperty(
        '--picker-max-width',
        `${Math.max(0, bounds.right - bounds.left - 2 * margin - borderWidth)}px`,
      );
      const roomAbove = triggerRect.top - bounds.top;
      const roomBelow = bounds.bottom - triggerRect.bottom;
      const pickerCap = reactionPickerOpen
        ? Math.max(
            0,
            Math.min(
              window.innerHeight * 0.6,
              Math.max(roomAbove, roomBelow) - margin,
            ),
          )
        : undefined;
      setPickerMaxHeight(pickerCap);
      const neededHeight =
        Math.min(dropdown.offsetHeight, pickerCap ?? Infinity) + margin;
      setOpenUpward(roomAbove >= neededHeight || roomAbove >= roomBelow);
      const neededWidth = dropdown.offsetWidth;
      const roomFromLeft = bounds.right - margin - triggerRect.left;
      const roomFromRight = triggerRect.right - bounds.left - margin;
      const start =
        roomFromLeft >= neededWidth || roomFromLeft >= roomFromRight;
      setAlignStart(start);
      const idealLeft = start
        ? triggerRect.left
        : triggerRect.right - neededWidth;
      const actualLeft = Math.max(
        bounds.left + margin,
        Math.min(idealLeft, bounds.right - margin - neededWidth),
      );
      dropdown.style.setProperty(
        '--picker-shift-x',
        `${actualLeft - idealLeft}px`,
      );
    };
    updatePlacement();
    const observer = new ResizeObserver(updatePlacement);
    observer.observe(dropdown);
    if (scroller) observer.observe(scroller);
    window.addEventListener('resize', updatePlacement);
    scroller?.addEventListener('scroll', updatePlacement, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePlacement);
      scroller?.removeEventListener('scroll', updatePlacement);
    };
  }, [menuOpen, reactionPickerOpen]);

  // リアクションの一覧を開いたら最初の選択肢へフォーカスを移す。
  useEffect(() => {
    if (!reactionPickerOpen) return;
    void refreshChatStamps();
    reactionPickerRef.current
      ?.querySelector<HTMLButtonElement>('button')
      ?.focus();
  }, [reactionPickerOpen]);

  // DropdownMenu の useClickOutside は mousedown しか見ていないので、
  // タッチ端末での「外側をタップして閉じる」ぶんはここで面倒を見る。
  // メニュー自身へのタッチで閉じてしまうと、項目に click が届く前に
  // アンマウントされて「押せないメニュー」になるので、内側は除外する。
  useEffect(() => {
    if (!menuOpen) return;
    const closeIfOutside = (e: TouchEvent) => {
      const anchor = menuAnchorRef.current;
      if (anchor && e.target instanceof Node && anchor.contains(e.target))
        return;
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
    onMoveBeyondSlop: () => {
      movedDuringTouch.current = true;
    },
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
    handleMenuOpenChange(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!canShowActions) return;
    // ブラウザ標準のメニューではなく、「···」と同じメニューを出す
    e.preventDefault();
    handleMenuOpenChange(true);
  };

  // 吹き出しの外側、時刻の真上に浮かせる。DropdownMenu 自身の .wrap は
  // position: relative を持つので、位置指定は上書きせず外側の span で行う
  // （同じプロパティをクラス1つ同士で争わせない）。
  const actionMenu = canShowActions && (
    <span
      ref={menuAnchorRef}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        menuAnchorRef.current
          ?.querySelector<HTMLButtonElement>(
            reactionPickerOpen
              ? '[aria-label="リアクションを付ける"]'
              : '[aria-label="メッセージの操作"]',
          )
          ?.focus();
        setMenuOpen(false);
        setReactionPickerOpen(false);
      }}
      className={`${styles.messageMenu} ${isMine ? styles.messageMenuLeft : styles.messageMenuRight} ${menuOpen ? styles.messageMenuOpen : ''}`}
    >
      {hasMessageMenu && (
        <DropdownMenu
          open={menuOpen && !reactionPickerOpen}
          onOpenChange={handleMenuOpenChange}
          ariaLabel="メッセージの操作"
          wrapClassName={styles.messageAction}
          triggerClassName={styles.messageMenuTrigger}
          dropdownClassName={`${styles.messageMenuDropdown} ${openUpward ? styles.messageMenuDropdownUp : styles.messageMenuDropdownDown} ${alignStart ? styles.messageMenuDropdownStart : styles.messageMenuDropdownEnd}`}
        >
          {(close) => (
            <>
              {canReply && (
                <DropdownMenuItem
                  icon={replyMenuIcon}
                  themedIcon
                  onClick={() => {
                    close();
                    onReply?.();
                  }}
                >
                  返信
                </DropdownMenuItem>
              )}
              {canEdit && (
                <DropdownMenuItem
                  icon={editIcon}
                  themedIcon
                  onClick={() => {
                    close();
                    onStartEdit();
                  }}
                >
                  編集
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  icon={deleteIcon}
                  themedIcon
                  danger
                  onClick={() => {
                    close();
                    onDelete();
                  }}
                >
                  削除
                </DropdownMenuItem>
              )}
              {canReport && (
                <DropdownMenuItem
                  icon={reportIcon}
                  themedIcon
                  danger
                  onClick={() => {
                    close();
                    onReport?.();
                  }}
                >
                  通報
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenu>
      )}
      {canReact && (
        <DropdownMenu
          open={menuOpen && reactionPickerOpen}
          onOpenChange={(next) => {
            setReactionPickerOpen(next);
            setMenuOpen(next);
          }}
          ariaLabel="リアクションを付ける"
          wrapClassName={styles.messageAction}
          trigger={
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="M20.5 13A8.5 8.5 0 1 1 11 3.5" strokeLinecap="round" />
              <path
                d="M8 14.5s1.5 2 4 2 4-2 4-2M8.5 9.5h.01M13.5 9.5h.01M19 2v6M16 5h6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          triggerClassName={`${styles.messageMenuTrigger} ${styles.reactionAddTrigger}`}
          dropdownClassName={`${styles.messageMenuDropdown} ${styles.reactionMenuDropdown} ${openUpward ? styles.messageMenuDropdownUp : styles.messageMenuDropdownDown} ${alignStart ? styles.messageMenuDropdownStart : styles.messageMenuDropdownEnd}`}
        >
          {(close) => (
            <div
              ref={reactionPickerRef}
              className={styles.reactionPicker}
              style={
                pickerMaxHeight
                  ? { maxHeight: `${pickerMaxHeight}px` }
                  : undefined
              }
              role="group"
              aria-label="リアクションを選ぶ"
            >
              {reactionEmojis.length === 0 && <StampCatalogNotice reaction />}
              {reactionEmojis.map((emoji) => {
                const reacted = reactions.some(
                  (r) => r.emoji === emoji && r.reactedByMe,
                );
                return (
                  <button
                    key={emoji}
                    type="button"
                    aria-pressed={reacted}
                    aria-label={`${reactionLabel(emoji)}を${reacted ? '外す' : '付ける'}`}
                    className={`${styles.reactionPickerButton} ${reacted ? styles.reactionPickerButtonActive : ''}`}
                    onClick={() => {
                      close();
                      onToggleReaction?.(emoji, reacted);
                    }}
                  >
                    <ReactionGlyph emoji={emoji} compact />
                  </button>
                );
              })}
            </div>
          )}
        </DropdownMenu>
      )}
    </span>
  );

  // 吹き出しの外側に置く情報。下から時刻・既読・編集済みと積み、
  // 操作ボタンはその上（絶対配置なので行の高さを増やさない）。
  const messageMeta = (
    <div
      className={`${styles.messageMeta} ${isMine ? styles.messageMetaMine : styles.messageMetaTheirs}`}
    >
      {actionMenu}
      {isEdited && !isEditing && (
        <span className={styles.editedLabel}>編集済み</span>
      )}
      {isMine && isReadByPartner && (
        <span className={styles.readReceipt}>既読</span>
      )}
      {isGroupEnd && (
        <span className={styles.timestamp}>
          {new Date(msg.createdAt).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )}
    </div>
  );

  const bubbleContent = (
    <div
      className={`${styles.messageBubble} ${isMine ? styles.mine : styles.theirs}`}
    >
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
      {!isMine && isGroupStart && (
        <span
          className={styles.senderName}
          onClick={() =>
            navigate(`/users/${msg.user.ID}`, {
              state: { from: location.pathname },
            })
          }
          style={{ cursor: 'pointer' }}
        >
          {msg.user.name}
        </span>
      )}

      <div
        className={`${styles.messageRow} ${isMine ? styles.messageRowMine : styles.messageRowTheirs}`}
        style={{
          // スワイプ返信では時刻ごと引く（吹き出しだけ動かすと時刻の上に重なる）
          transform:
            swipe.offset !== 0 ? `translateX(${swipe.offset}px)` : undefined,
          // 指を離したときだけ滑らかに戻す（ドラッグ中は指に追従させる）
          transition:
            swipe.offset === 0 ? 'transform 0.18s ease-out' : undefined,
        }}
      >
        {isMine && messageMeta}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={swipe.handlers.onTouchEnd}
          onTouchMove={swipe.handlers.onTouchMove}
          onTouchCancel={swipe.handlers.onTouchCancel}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          className={`${styles.messageContentWrap} ${isMine ? styles.messageContentMine : styles.messageContentTheirs}`}
        >
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
                  if (e.key === 'Escape') {
                    onCancelEdit();
                    return;
                  }
                  const isTouch =
                    window.matchMedia('(pointer: coarse)').matches;
                  if (isTouch) return;
                  if (
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    onSaveEdit();
                  }
                }}
                autoFocus
              />
              <div className={styles.editActions}>
                <button className={styles.editSaveBtn} onClick={onSaveEdit}>
                  保存
                </button>
                <button className={styles.editCancelBtn} onClick={onCancelEdit}>
                  キャンセル
                </button>
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
              {isStamp ? (
                <div
                  className={`${styles.stampMessage} ${isMine ? styles.stampMessageMine : styles.stampMessageTheirs}`}
                >
                  {isReply && (
                    <div
                      className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}
                    >
                      <ReplyQuote
                        replyTo={msg.replyTo}
                        isMine={isMine}
                        onJump={onJumpToMessage}
                      />
                    </div>
                  )}
                  <ReactionGlyph emoji={msg.stampID!} large />
                </div>
              ) : isReply ? (
                <div
                  className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}
                >
                  <ReplyQuote
                    replyTo={msg.replyTo}
                    isMine={isMine}
                    onJump={onJumpToMessage}
                  />
                  {hasText && renderMessageBody(msg.content)}
                  {filesRemoved && (
                    <span className={styles.filesRemoved}>
                      {FILES_REMOVED_TEXT}
                    </span>
                  )}
                </div>
              ) : hasText ? (
                <div
                  className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}
                >
                  {msg.thread
                    ? msg.thread.title
                    : renderMessageBody(msg.content)}
                </div>
              ) : (
                filesRemoved && (
                  <div
                    className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}
                  >
                    <span className={styles.filesRemoved}>
                      {FILES_REMOVED_TEXT}
                    </span>
                  </div>
                )
              )}
              {hasMedia && <MediaList mediaItems={msg.media} isMine={isMine} />}
            </>
          )}
        </div>
        {!isMine && messageMeta}
      </div>
      {!isEditing && !isThread && reactions.length > 0 && (
        <div className={styles.messageReactions}>
          <ReactionBar
            reactions={reactions}
            isMine={isMine}
            onToggle={onToggleReaction}
            allowedEmojis={reactionEmojis}
          />
        </div>
      )}
      {msg.thread && <ThreadCard thread={msg.thread} isMine={isMine} />}
    </div>
  );

  const groupStartClass = isGroupStart ? styles.messageGroupStart : '';

  if (isMine) {
    return (
      <div
        data-message-id={msg.ID}
        className={`${styles.messageHighlightTarget} ${groupStartClass}`}
      >
        {bubbleContent}
      </div>
    );
  }

  return (
    <div
      className={`${styles.theirRow} ${styles.messageHighlightTarget} ${groupStartClass}`}
      data-message-id={msg.ID}
    >
      {/* 続きのメッセージではアイコンを出さないが、吹き出しの左端は揃えたいので場所だけ空ける */}
      {isGroupStart ? (
        <UserAvatar
          userId={msg.user.ID}
          name={msg.user.name}
          avatarUrl={msg.user.avatarUrl}
          size={32}
        />
      ) : (
        <span className={styles.avatarSpacer} aria-hidden="true" />
      )}
      <div className={styles.theirContent}>{bubbleContent}</div>
    </div>
  );
};
