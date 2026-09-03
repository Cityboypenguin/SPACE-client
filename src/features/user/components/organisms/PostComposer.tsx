import { useRef, useEffect, useState, type ReactNode } from 'react';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { Avatar } from '../../../../components/atoms/Avatar';
import { storageUrl } from '../../../../lib/storage';
import { useToast } from '../../../../context/ToastContext';
import { useHashtagSuggestions } from '../../hooks/useHashtagSuggestions';
import { HashtagSuggestionList } from '../molecules/HashtagSuggestionList';
import cameraIcon from '../../../../assets/パーツ_画像送付.svg';
import styles from './PostComposer.module.css';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 4;

// 入力中の本文からハッシュタグ部分だけを色付けするためのハイライト用ノードを生成する。
// ルールは表示側 (renderTextWithLinks) / サーバー側 (hashtag.go) と揃える:
//   マーカー "#"（直後に空白なし）が本文先頭 or 直前が空白のときのみ、最初の空白までをタグとして着色。
const HASHTAG_HL_REGEX = /#[^\s]+/g;
const WHITESPACE_REGEX = /\s/;
const HASHTAG_COLOR = '#1d9bf0';

// キャレット位置(caret)から、いま編集中のハッシュタグトークンを取り出す。
// 返り値: { query: "#"の後ろ〜caretの文字列, start: "#"の位置, end: トークン末尾 } / なければ null。
function getActiveHashtag(text: string, caret: number): { query: string; start: number; end: number } | null {
  let i = caret - 1;
  while (i >= 0 && !WHITESPACE_REGEX.test(text[i]) && text[i] !== '#') i--;
  if (i < 0 || text[i] !== '#') return null;
  // "#" は本文先頭 or 直前が空白のときのみ有効。
  if (!(i === 0 || WHITESPACE_REGEX.test(text[i - 1]))) return null;
  let end = caret;
  while (end < text.length && !WHITESPACE_REGEX.test(text[end])) end++;
  return { query: text.slice(i + 1, caret), start: i, end };
}

function renderHashtagHighlight(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  HASHTAG_HL_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = HASHTAG_HL_REGEX.exec(text)) !== null) {
    const start = match.index;
    if (!(start === 0 || WHITESPACE_REGEX.test(text[start - 1]))) {
      continue;
    }
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }
    nodes.push(
      <span key={key++} style={{ color: HASHTAG_COLOR }}>{match[0]}</span>,
    );
    lastIndex = start + match[0].length;
  }
  nodes.push(text.slice(lastIndex));
  return nodes;
}

type MinimalMedia = {
  ID: string;
  url: string;
  contentType: string;
};

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error?: string;
  placeholder?: string;
  rows?: number;
  submitLabel?: string;
  submittingLabel?: string;
  iconSize?: number;
  userId?: string | null;
  avatarUrl?: string | null;
  userName?: string;
  accountId?: string;
  selectedFiles?: File[];
  onFileSelect?: (files: File[]) => void;
  existingMedia?: MinimalMedia[];
  deletedMediaIDs?: string[];
  onDeleteExistingMedia?: (id: string) => void;
  onCancel?: () => void;
  cancelLabel?: string;
  isEmbedded?: boolean;
  maxLength?: number;
  enableHashtagSuggestions?: boolean;
};

export const PostComposer = ({
  value,
  onChange,
  onSubmit,
  submitting,
  error,
  placeholder = 'いまどうしてる？',
  rows = 3,
  submitLabel = '投稿する',
  submittingLabel = '投稿中...',
  iconSize = 44,
  userId,
  avatarUrl,
  userName = '',
  accountId,
  selectedFiles = [],
  onFileSelect,
  existingMedia = [],
  deletedMediaIDs = [],
  onDeleteExistingMedia,
  onCancel,
  cancelLabel = 'キャンセル',
  isEmbedded = false,
  maxLength,
  enableHashtagSuggestions = false,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const previewUrlCacheRef = useRef<Map<File, string>>(new Map());
  const visibleExistingMedia = existingMedia.filter(m => !deletedMediaIDs.includes(m.ID));
  const totalMediaCount = visibleExistingMedia.length + selectedFiles.length;
  const { addToast } = useToast();
  const large = rows >= 3;

  const [isDragging, setIsDragging] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // ハッシュタグサジェスト用の状態。
  const [caretPos, setCaretPos] = useState(0);
  const [focused, setFocused] = useState(false);
  const [suggestDismissed, setSuggestDismissed] = useState(false);
  const [suggestActiveIndex, setSuggestActiveIndex] = useState(0);

  const activeHashtag = enableHashtagSuggestions ? getActiveHashtag(value, caretPos) : null;
  const suggestions = useHashtagSuggestions(
    focused && !suggestDismissed && activeHashtag ? activeHashtag.query : null,
  );
  const showSuggestions = enableHashtagSuggestions && focused && !suggestDismissed && activeHashtag !== null && suggestions.length > 0;

  const selectSuggestion = (tag: string) => {
    if (!activeHashtag) return;
    const before = value.slice(0, activeHashtag.start);
    const after = value.slice(activeHashtag.end);
    // 直後が空白でなければ空白を補い、続けて入力できるようにする。
    const needsSpace = after === '' || !WHITESPACE_REGEX.test(after[0]);
    const inserted = `#${tag}${needsSpace ? ' ' : ''}`;
    const newValue = `${before}${inserted}${after}`;
    const newCaret = before.length + inserted.length;
    onChange(newValue);
    setSuggestDismissed(true);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = newCaret;
        setCaretPos(newCaret);
      }
    });
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    const cache = previewUrlCacheRef.current;
    const selectedSet = new Set(selectedFiles);

    for (const [file, url] of cache) {
      if (!selectedSet.has(file)) {
        URL.revokeObjectURL(url);
        cache.delete(file);
      }
    }

    setPreviewUrls(selectedFiles.map((file) => {
      const cachedUrl = cache.get(file);
      if (cachedUrl) return cachedUrl;

      const url = URL.createObjectURL(file);
      cache.set(file, url);
      return url;
    }));
  }, [selectedFiles]);

  useEffect(() => () => {
    previewUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlCacheRef.current.clear();
  }, []);

  const addFiles = (incoming: File[]) => {
    if (totalMediaCount + incoming.length > MAX_IMAGES) {
      addToast(`最大${MAX_IMAGES}枚までしか投稿できません。`, 'error');
      return;
    }

    if (incoming.some((f) => !ACCEPTED_IMAGE_TYPES.includes(f.type))) {
      addToast('対応していないファイル形式が含まれています。', 'error');
      return;
    }

    if (incoming.some((f) => f.size > MAX_FILE_SIZE)) {
      addToast('10MBを超えるファイルが含まれています。', 'error');
      return;
    }

    onFileSelect?.([...selectedFiles, ...incoming]);
  };

  // ▼ 変更: 単一ファイルから複数ファイルの配列処理に変更
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;
    addFiles(incoming);
    e.target.value = '';
  };

  // ▼ 新規追加: ドラッグ＆ドロップイベントのハンドラー
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!submitting && onFileSelect && totalMediaCount < MAX_IMAGES) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (submitting || !onFileSelect) return;

    const incoming = Array.from(e.dataTransfer.files);
    if (!incoming.length) return;
    addFiles(incoming);
  };

  const removeFile = (index: number) => {
    onFileSelect?.(selectedFiles.filter((_, i) => i !== index));
  };

  // ▼ 新規追加: クリップボードから画像が貼り付けられた場合に写真として扱う
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!onFileSelect || submitting) return;

    const items = Array.from(e.clipboardData.items);
    const imageFiles = items
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (!imageFiles.length) return;

    e.preventDefault();
    addFiles(imageFiles);
  };

  const hasAnyContent = value.trim() !== '' || totalMediaCount > 0;
  const overLimit = maxLength !== undefined && value.length > maxLength;
  const canSubmit = !submitting && hasAnyContent && !overLimit;

  return (
    <div
      className={`${styles.wrapper} ${isEmbedded ? styles.wrapperEmbedded : styles.wrapperNormal}`}
      // ▼ 追加: ドラッグ＆ドロップのイベントを外枠に紐付け
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: 'relative' }} // オーバーレイ表示の基準点にするため追加
    >
      {/* ▼ 追加: ドラッグ中のオーバーレイUI */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '2px dashed #6b7280',
            borderRadius: 8,
            background: 'rgba(107, 114, 128, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
        </div>
      )}

      {userId && userName ? (
        <UserAvatar userId={userId} name={userName} avatarUrl={avatarUrl} size={iconSize} />
      ) : userName ? (
        <Avatar name={userName} size={iconSize} />
      ) : (
        <div
          style={{
            width: iconSize, height: iconSize, borderRadius: '50%',
            background: 'linear-gradient(135deg,#646cff,#a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: iconSize >= 40 ? '1.2rem' : '1rem', flexShrink: 0,
          }}
        >✍️</div>
      )}
      <div className={styles.inner}>
        {!isEmbedded && userName && (
          <div className={styles.nameRow}>
            <span className={styles.displayName}>{userName}</span>
            {accountId && <span className={styles.accountId}>@{accountId}</span>}
          </div>
        )}
        <div className={styles.textareaStack}>
          <div
            ref={backdropRef}
            aria-hidden="true"
            className={`${styles.highlightBackdrop} ${large ? styles.textareaLarge : styles.textareaSmall}`}
          >
            {renderHashtagHighlight(value)}
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (enableHashtagSuggestions) {
                setCaretPos(e.target.selectionStart ?? 0);
                setSuggestDismissed(false);
                setSuggestActiveIndex(0);
              }
            }}
            onKeyUp={(e) => { if (enableHashtagSuggestions) setCaretPos(e.currentTarget.selectionStart ?? 0); }}
            onClick={(e) => { if (enableHashtagSuggestions) setCaretPos(e.currentTarget.selectionStart ?? 0); }}
            onFocus={() => { if (enableHashtagSuggestions) { setFocused(true); setSuggestDismissed(false); } }}
            onBlur={() => { if (enableHashtagSuggestions) setFocused(false); }}
            onKeyDown={(e) => {
              if (!showSuggestions) return;
              // IME変換中の Enter 等は確定操作なので横取りしない。
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                setSuggestActiveIndex(prev => {
                  const clamped = Math.min(prev, suggestions.length - 1);
                  return e.key === 'ArrowDown'
                    ? Math.min(clamped + 1, suggestions.length - 1)
                    : Math.max(clamped - 1, 0);
                });
              } else if (e.key === 'Enter' || e.key === 'Tab') {
                // 候補が出ているときは Enter/Tab で確定（改行は挿入しない）。
                e.preventDefault();
                const chosen = suggestions[Math.min(suggestActiveIndex, suggestions.length - 1)];
                if (chosen) selectSuggestion(chosen.tag);
              } else if (e.key === 'Escape') {
                setSuggestDismissed(true);
              }
            }}
            onPaste={handlePaste}
            onScroll={(e) => {
              if (backdropRef.current) {
                backdropRef.current.scrollTop = e.currentTarget.scrollTop;
                backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
            placeholder={placeholder}
            rows={rows}
            className={`${styles.textarea} ${styles.textareaHighlighted} ${large ? styles.textareaLarge : styles.textareaSmall}`}
          />
          {showSuggestions && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, marginTop: 4 }}>
              <HashtagSuggestionList
                suggestions={suggestions}
                activeIndex={Math.min(suggestActiveIndex, suggestions.length - 1)}
                onSelect={selectSuggestion}
                onHover={setSuggestActiveIndex}
              />
            </div>
          )}
        </div>
        {maxLength !== undefined && (
          <div className={`${styles.charCount} ${overLimit ? styles.charCountOver : ''}`}>
            {value.length} / {maxLength}
          </div>
        )}

        {totalMediaCount > 0 && (
          <div className={styles.mediaPreviews}>
            {visibleExistingMedia.map((m) => {
              const isImage = m.contentType.startsWith('image/');
              return (
                <div key={m.ID} className={styles.mediaThumb}>
                  {isImage ? (
                    <img src={storageUrl(m.url)} alt="既存メディア" className={styles.mediaThumbImg} />
                  ) : (
                    <div className={styles.mediaThumbFile}>FILE</div>
                  )}
                  {onDeleteExistingMedia && (
                    <button type="button" className={styles.removeButton} onClick={() => onDeleteExistingMedia(m.ID)}>✕</button>
                  )}
                </div>
              );
            })}
            {selectedFiles.map((file, i) => (
              <div key={`new-${i}`} className={styles.mediaThumb}>
                {previewUrls[i] && (
                  <img
                    src={previewUrls[i]}
                    alt={file.name}
                    className={styles.mediaThumbImg}
                    decoding="async"
                  />
                )}
                <button type="button" className={styles.removeButton} onClick={() => removeFile(i)}>✕</button>
              </div>
            ))}
            {totalMediaCount < MAX_IMAGES && onFileSelect && (
              <button type="button" className={styles.addMoreButton} onClick={() => fileInputRef.current?.click()}>+</button>
            )}
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <div className={`${styles.footer} ${large ? styles.footerLarge : styles.footerSmall}`}>
          {onFileSelect && (
            <input
              ref={fileInputRef}
              type="file"
              multiple /* ← ▼ 追加: ファイル選択ダイアログで複数選択を許可 */
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className={`${styles.cancelButton} ${large ? styles.cancelButtonLarge : styles.cancelButtonSmall}`}
            >
              {cancelLabel}
            </button>
          )}
          {onFileSelect && totalMediaCount === 0 && (
            <button
              type="button"
              className={styles.cameraButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
              title={`写真を追加 (最大${MAX_IMAGES}枚)`}
            >
              <img src={cameraIcon} alt="写真を追加" className={styles.cameraIcon} />
            </button>
          )}
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`${styles.submitButton} ${large ? styles.submitButtonLarge : styles.submitButtonSmall}`}
            style={{ background: canSubmit ? '#FF7430' : '#F89150', cursor: canSubmit ? 'pointer' : 'default' }}
          >
            {submitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
