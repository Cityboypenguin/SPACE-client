import { useEffect, useRef, useState, type TouchEvent, type MouseEvent, type WheelEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import editIcon from '../../../../assets/パーツ_メッセージ編集.svg';
import { type Message, type Media } from '../../api/message';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { storageUrl } from '../../../../lib/storage';
import styles from '../ChatRoom.module.css';

const URL_REGEX = /(https?:\/\/[^\s 《》「」（）、。！？]+)/g;

const renderWithLinks = (text: string) => {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all' }}
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

const ImageLightbox = ({
  urls,
  initialIndex,
  onClose,
}: {
  urls: string[];
  initialIndex: number;
  onClose: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const positionRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  const startDistance = useRef<number | null>(null);
  const startScale = useRef<number>(1);
  const startTouchPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const hasMoved = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isSwipeToCloseActive = useRef(false);
  const isSwipeToNavActive = useRef(false);
  const swipeDirectionDetermined = useRef<boolean>(false);

  const [isDesktop, setIsDesktop] = useState(false);
  const currentUrl = urls[currentIndex];

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateDOMTransform = (s: number, x: number, y: number, disableTransition = false) => {
    if (containerRef.current) {
      containerRef.current.style.transition = disableTransition ? 'none' : 'transform 0.15s ease-out';
      containerRef.current.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    }
  };

  const resetPosition = (smooth = true) => {
    positionRef.current = { x: 0, y: 0 };
    updateDOMTransform(scaleRef.current, 0, 0, !smooth);
  };

  const showPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      scaleRef.current = 1;
      setScale(1);
      resetPosition(false);
    }
  };

  const showNext = () => {
    if (currentIndex < urls.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      scaleRef.current = 1;
      setScale(1);
      resetPosition(false);
    }
  };

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: TouchEvent) => {
    hasMoved.current = false;
    isSwipeToCloseActive.current = false;
    isSwipeToNavActive.current = false;
    swipeDirectionDetermined.current = false;

    if (e.touches.length === 2) {
      startDistance.current = getDistance(e.touches);
      startScale.current = scaleRef.current;
    } else if (e.touches.length === 1) {
      startTouchPos.current = {
        x: e.touches[0].clientX - positionRef.current.x,
        y: e.touches[0].clientY - positionRef.current.y,
      };
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    hasMoved.current = true;

    if (e.touches.length === 2 && startDistance.current !== null) {
      const distance = getDistance(e.touches);
      const newScale = startScale.current * (distance / startDistance.current);
      const nextScale = Math.max(0.8, Math.min(newScale, 4));
      
      scaleRef.current = nextScale;
      setScale(nextScale);

      if (nextScale <= 1) {
        resetPosition(false);
      } else {
        updateDOMTransform(nextScale, positionRef.current.x, positionRef.current.y, true);
      }
    } else if (e.touches.length === 1) {
      const x = e.touches[0].clientX - startTouchPos.current.x;
      const y = e.touches[0].clientY - startTouchPos.current.y;

      if (scaleRef.current > 1) {
        positionRef.current = { x, y };
        updateDOMTransform(scaleRef.current, x, y, true);
      } else {
        if (!swipeDirectionDetermined.current) {
          const absX = Math.abs(x);
          const absY = Math.abs(y);
          
          if (absX > 5 || absY > 5) {
            swipeDirectionDetermined.current = true;
            if (absX > absY * 1.5) {
              isSwipeToNavActive.current = true;
              isSwipeToCloseActive.current = false;
            } else if (absY > absX * 1.8) {
              isSwipeToCloseActive.current = true;
              isSwipeToNavActive.current = false;
            } else {
              isSwipeToCloseActive.current = false;
              isSwipeToNavActive.current = false;
            }
          }
        }

        if (isSwipeToNavActive.current) {
          positionRef.current = { x, y: 0 };
          updateDOMTransform(scaleRef.current, x, 0, true);
        } else if (isSwipeToCloseActive.current) {
          positionRef.current = { x: 0, y };
          updateDOMTransform(scaleRef.current, 0, y, true);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    startDistance.current = null;

    if (isSwipeToNavActive.current && scaleRef.current <= 1) {
      const dragX = positionRef.current.x;
      if (dragX > 80 && currentIndex > 0) {
        showPrev();
        return;
      } else if (dragX < -80 && currentIndex < urls.length - 1) {
        showNext();
        return;
      }
    }

    if (isSwipeToCloseActive.current && scaleRef.current <= 1) {
      const dragY = positionRef.current.y;
      if (Math.abs(dragY) > 150) {
        onClose();
        return;
      }
    }

    if (scaleRef.current <= 1) {
      scaleRef.current = 1;
      setScale(1);
      resetPosition(true);
    }
    isSwipeToCloseActive.current = false;
    isSwipeToNavActive.current = false;
    swipeDirectionDetermined.current = false;
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (scaleRef.current <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    hasMoved.current = false;
    startTouchPos.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || scaleRef.current <= 1) return;
    hasMoved.current = true;
    const x = e.clientX - startTouchPos.current.x;
    const y = e.clientY - startTouchPos.current.y;
    
    positionRef.current = { x, y };
    updateDOMTransform(scaleRef.current, x, y, true);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.15;
    const delta = e.deltaY < 0 ? 1 : -1;
    const newScale = scaleRef.current + delta * zoomIntensity;
    const nextScale = Math.max(1, Math.min(newScale, 4));
    
    scaleRef.current = nextScale;
    setScale(nextScale);

    if (nextScale <= 1) {
      resetPosition(true);
    } else {
      updateDOMTransform(nextScale, positionRef.current.x, positionRef.current.y, true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, urls]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    e.stopPropagation();
    
    if (hasMoved.current) {
      hasMoved.current = false;
      return;
    }
    if (scale > 1) return;

    onClose();
  };

  return (
    <div
      onClick={handleOverlayClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-out',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: 'absolute',
          top: 16,
          right: 20,
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '2rem',
          cursor: 'pointer',
          lineHeight: 1,
          zIndex: 10000,
        }}
      >
        ✕
      </button>

      {isDesktop && currentIndex > 0 && scale === 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); showPrev(); }}
          style={{
            position: 'absolute',
            left: 20,
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: '#fff',
            fontSize: '1.5rem',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ‹
        </button>
      )}

      {isDesktop && currentIndex < urls.length - 1 && scale === 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); showNext(); }}
          style={{
            position: 'absolute',
            right: 20,
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: '#fff',
            fontSize: '1.5rem',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ›
        </button>
      )}

      {urls.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '16px',
            fontSize: '0.9rem',
            zIndex: 10000,
          }}
        >
          {currentIndex + 1} / {urls.length}
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translate(0px, 0px) scale(1)`,
          willChange: 'transform',
        }}
      >
        <img
          src={currentUrl}
          alt="拡大表示"
          onClick={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
          style={{
            maxWidth: '95vw',
            maxHeight: '95vh',
            objectFit: 'contain',
            borderRadius: 8,
            userSelect: 'none',
          }}
        />
      </div>
    </div>
  );
};

const MediaList = ({ mediaItems, isMine }: { mediaItems: Media[]; isMine: boolean }) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const images = mediaItems.filter((m) => m.contentType.startsWith('image/'));
  const files = mediaItems.filter((m) => !m.contentType.startsWith('image/'));

  const imageUrls = images.map((m) => storageUrl(m.url));

  return (
    <>
      {images.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 3,
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          maxWidth: images.length === 1 ? 200 : 160,
        }}>
          {images.map((m, i) => {
            const url = storageUrl(m.url);
            return (
              <img
                key={m.ID}
                src={url}
                alt="添付画像"
                onClick={() => setActiveImageIndex(i)}
                style={{
                  width: images.length === 1 ? '100%' : 76,
                  height: images.length === 1 ? 'auto' : 76,
                  maxWidth: images.length === 1 ? 200 : 76,
                  maxHeight: images.length === 1 ? 200 : 76,
                  objectFit: 'cover',
                  borderRadius: 8,
                  cursor: 'zoom-in',
                  display: 'block',
                }}
              />
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: isMine ? 'flex-end' : 'flex-start' }}>
          {files.map((m) => (
            <a
              key={m.ID}
              href={storageUrl(m.url)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 10px',
                background: isMine ? '#dbeafe' : '#f3f4f6',
                border: `1px solid ${isMine ? '#bfdbfe' : '#e5e7eb'}`,
                borderRadius: 8,
                fontSize: '0.78rem', color: '#374151',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: '1rem' }}>{getFileIcon(m.contentType)}</span>
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
};

export const ChatMessageBubble = ({
  msg, isMine, canDelete, isEditing,
  editContent, onStartEdit, onSaveEdit, onCancelEdit,
  onEditContentChange, onDelete, isReadByPartner,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const hasText = msg.content.trim() !== '';
  const hasMedia = msg.media && msg.media.length > 0;
  const canEdit = isMine && !hasMedia;
  const canShowActions = (canEdit || canDelete) && !isEditing;

  const [showActions, setShowActions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing || !editTextareaRef.current) return;
    const el = editTextareaRef.current;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [isEditing]);

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    if (!canShowActions) return;
    clearLongPressTimer();
    longPressTimer.current = setTimeout(() => setShowActions(true), 500);
  };

  useEffect(() => {
    if (!showActions) return;
    const handleOutside = (e: Event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [showActions]);

  const bubbleContent = (
    <div className={`${styles.messageBubble} ${isMine ? styles.mine : styles.theirs}`}>
      {!isMine && (
        <span
          className={styles.senderName}
          onClick={() => navigate(`/users/${msg.user.ID}`, { state: { from: location.pathname } })}
          style={{ cursor: 'pointer' }}
        >
          {msg.user.name}
        </span>
      )}

      <div
        ref={wrapperRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={clearLongPressTimer}
        onTouchMove={clearLongPressTimer}
        onTouchCancel={clearLongPressTimer}
        onContextMenu={(e) => { if (canShowActions) e.preventDefault(); }}
        style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', gap: 3, alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '80%' }}
      >
        {canShowActions && (
          <div
            className={`${styles.messageActions} ${isMine ? styles.messageActionsLeft : styles.messageActionsRight} ${showActions ? styles.messageActionsVisible : ''}`}
          >
            {canEdit && (
              <button
                className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                onClick={() => { setShowActions(false); onStartEdit(); }}
                title="編集"
              ><img src={editIcon} alt="編集" className={styles.actionIcon} /></button>
            )}
            {canDelete && (
              <button
                className={styles.actionBtn}
                onClick={() => { setShowActions(false); onDelete(); }}
                title="削除"
              >✕</button>
            )}
          </div>
        )}
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
          </div>
        ) : (
          <>
            {hasText && (
              <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                {renderWithLinks(msg.content)}
              </div>
            )}
            {hasMedia && <MediaList mediaItems={msg.media} isMine={isMine} />}
          </>
        )}
      </div>

      <span className={styles.timestamp}>
        {new Date(msg.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
      </span>
      {isMine && isReadByPartner && (
        <span className={styles.readReceipt}>既読</span>
      )}
    </div>
  );

  if (isMine) return bubbleContent;

  return (
    <div className={styles.theirRow}>
      <UserAvatar userId={msg.user.ID} name={msg.user.name} avatarUrl={msg.user.avatarUrl} size={32} />
      <div className={styles.theirContent}>{bubbleContent}</div>
    </div>
  );
};
