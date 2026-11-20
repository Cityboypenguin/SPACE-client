import { useRef, useEffect, useState, type ReactNode } from 'react';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { Avatar } from '../../../../components/atoms/Avatar';
import { storageUrl } from '../../../../lib/storage';
import { useToast } from '../../../../context/useToast';
import { useHashtagSuggestions } from '../../hooks/useHashtagSuggestions';
import { HashtagSuggestionList } from '../molecules/HashtagSuggestionList';
import { useMentionSuggestions } from '../../hooks/useMentionSuggestions';
import { MentionSuggestionList } from '../molecules/MentionSuggestionList';
import { applyMention, getActiveAccountMention, type MentionCandidate } from '../../../../lib/mentions';
import cameraIcon from '../../../../assets/パーツ_画像送付.svg';
import styles from './PostComposer.module.css';
import { type Media } from '../../../../lib/media';
import { type Video } from '../../../../lib/video/fields';
import { ACCEPTED_VIDEO_TYPES, isVideoFile } from '../../../../lib/video/constants';
import type { VideoDraftController } from '../../hooks/useVideoDraft';
import { VideoDraftPanel } from '../molecules/VideoDraftPanel';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 4;

// 入力中の本文からハッシュタグ・メンション部分だけを色付けするためのハイライト用ノードを生成する。
// ルールは表示側 (renderTextWithLinks) / サーバー側 (hashtag.go, mention.go) と揃える:
//   - ハッシュタグ: マーカー "#"（直後に空白なし）が本文先頭 or 直前が空白のときのみ、
//     最初の空白までをタグとして着色。
//   - メンション: マーカー "@"/"＠" が本文先頭 or 直前が空白のときのみ、
//     accountID として有効な文字（[a-zA-Z0-9_-]、最大25文字）までを着色。
// メンションの着色は入力中のヒントなので、実在するユーザーかどうかまでは見ない
// （実際に成立したかは投稿後の表示で分かる）。
const HIGHLIGHT_REGEX = /(#[^\s]+)|([@＠][a-zA-Z0-9_-]{1,25})/g;
const WHITESPACE_REGEX = /\s/;

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

function renderComposerHighlight(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  HIGHLIGHT_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = HIGHLIGHT_REGEX.exec(text)) !== null) {
    const start = match.index;
    if (!(start === 0 || WHITESPACE_REGEX.test(text[start - 1]))) {
      continue;
    }
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }
    nodes.push(
      <span key={key++} className={styles.hashtagHighlight}>{match[0]}</span>,
    );
    lastIndex = start + match[0].length;
  }
  nodes.push(text.slice(lastIndex));
  return nodes;
}

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
  existingMedia?: Media[];
  deletedMediaIDs?: string[];
  onDeleteExistingMedia?: (id: string) => void;
  onCancel?: () => void;
  cancelLabel?: string;
  isEmbedded?: boolean;
  maxLength?: number;
  enableHashtagSuggestions?: boolean;
  // メンション (@accountID) のサジェスト。投稿・返信のどこでもメンションは書けるので既定で有効。
  enableMentionSuggestions?: boolean;
  // 動画（1本まで）。渡したときだけ動画の追加ボタンを出す。画像とは同時に付けられない。
  videoDraft?: VideoDraftController;
  // 編集中の投稿に付いている動画。編集では外すことだけできる（後から足すことはできない）。
  existingVideo?: Video | null;
  existingVideoRemoved?: boolean;
  onRemoveExistingVideo?: () => void;
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
  videoDraft,
  existingVideo,
  existingVideoRemoved = false,
  onRemoveExistingVideo,
  enableMentionSuggestions = true,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 写真の追加ボタンから動画も選べる（動画を付けられる入力欄のとき）。
  const canAttach = !!onFileSelect || !!videoDraft;
  const acceptTypes = [...(onFileSelect ? ACCEPTED_IMAGE_TYPES : []), ...(videoDraft ? ACCEPTED_VIDEO_TYPES : [])].join(',');
  const existingVideoVisible = !!existingVideo && !existingVideoRemoved;
  // 動画が付いている（圧縮中を含む）あいだは画像を足せない。
  const hasVideo = (videoDraft?.hasVideo ?? false) || existingVideoVisible;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const previewUrlCacheRef = useRef<Map<File, string>>(new Map());
  const visibleExistingMedia = existingMedia.filter(m => !deletedMediaIDs.includes(m.ID));
  const totalMediaCount = visibleExistingMedia.length + selectedFiles.length;
  const { addToast } = useToast();
  const large = rows >= 3;

  const [isDragging, setIsDragging] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // サジェスト（ハッシュタグ / メンション共用）の状態。
  const [caretPos, setCaretPos] = useState(0);
  const [focused, setFocused] = useState(false);
  const [suggestDismissed, setSuggestDismissed] = useState(false);
  const [suggestActiveIndex, setSuggestActiveIndex] = useState(0);

  // ハッシュタグとメンションは同じトークンにはならない（# と @ で始まりが排他）ので、
  // どちらか一方だけが有効になる。
  const suggestActive = focused && !suggestDismissed;
  const activeHashtag = enableHashtagSuggestions ? getActiveHashtag(value, caretPos) : null;
  const activeMention = enableMentionSuggestions ? getActiveAccountMention(value, caretPos) : null;

  const hashtagSuggestions = useHashtagSuggestions(
    suggestActive && activeHashtag ? activeHashtag.query : null,
  );
  const mentionSuggestions = useMentionSuggestions(
    suggestActive && activeMention ? activeMention.query : null,
  );

  const showHashtagSuggestions = suggestActive && activeHashtag !== null && hashtagSuggestions.length > 0;
  const showMentionSuggestions = suggestActive && activeMention !== null && mentionSuggestions.length > 0;
  const suggestionCount = showHashtagSuggestions
    ? hashtagSuggestions.length
    : showMentionSuggestions
      ? mentionSuggestions.length
      : 0;
  const showSuggestions = suggestionCount > 0;

  // 差し替え後のキャレット位置を反映する。onChange 直後は DOM がまだ古いので
  // 次フレームで設定する（ハッシュタグ・メンション共通）。
  const applyToTextarea = (newValue: string, newCaret: number) => {
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

  const selectHashtagSuggestion = (tag: string) => {
    if (!activeHashtag) return;
    const before = value.slice(0, activeHashtag.start);
    const after = value.slice(activeHashtag.end);
    // 直後が空白でなければ空白を補い、続けて入力できるようにする。
    const needsSpace = after === '' || !WHITESPACE_REGEX.test(after[0]);
    const inserted = `#${tag}${needsSpace ? ' ' : ''}`;
    applyToTextarea(`${before}${inserted}${after}`, before.length + inserted.length);
  };

  const selectMentionSuggestion = (candidate: MentionCandidate) => {
    if (!activeMention) return;
    // 投稿のメンションは "@accountID"。表示名ではなく accountID を挿入する。
    const { value: newValue, caret } = applyMention(value, activeMention, candidate.accountID);
    applyToTextarea(newValue, caret);
  };

  // 候補リストの index を確定させる（キーボード/クリック共通）。
  const confirmSuggestion = (index: number) => {
    if (showHashtagSuggestions) {
      const chosen = hashtagSuggestions[Math.min(index, hashtagSuggestions.length - 1)];
      if (chosen) selectHashtagSuggestion(chosen.tag);
    } else if (showMentionSuggestions) {
      const chosen = mentionSuggestions[Math.min(index, mentionSuggestions.length - 1)];
      if (chosen) selectMentionSuggestion(chosen);
    }
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

  // addFiles は写真の追加ボタン・ドラッグ＆ドロップ・貼り付けの共通の入口。動画が混ざっていれば
  // 動画として扱う（動画は1本だけで、画像とは一緒に付けられない）。
  const addFiles = (incoming: File[]) => {
    const videos = incoming.filter(isVideoFile);
    if (videos.length > 0) {
      if (!videoDraft) {
        addToast('ここには動画を付けられません。', 'error');
        return;
      }
      if (incoming.length > 1) {
        addToast('動画は1本だけ、画像とは別に選んでください。', 'error');
        return;
      }
      if (hasVideo) {
        addToast('動画は1本までです。', 'error');
        return;
      }
      if (totalMediaCount > 0) {
        addToast('動画と画像は同時に付けられません。', 'error');
        return;
      }
      videoDraft.select(videos[0]);
      return;
    }
    if (!onFileSelect) return;
    if (hasVideo) {
      addToast('動画と画像は同時に付けられません。', 'error');
      return;
    }
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
    if (!submitting && canAttach && totalMediaCount < MAX_IMAGES) {
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
    if (submitting || !canAttach) return;

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

  const hasAnyContent = value.trim() !== '' || totalMediaCount > 0 || videoDraft?.state.status === 'ready' || existingVideoVisible;
  const overLimit = maxLength !== undefined && value.length > maxLength;
  // 圧縮中・アップロード中は送らせない（同じ投稿を二重に送らないため）。
  const canSubmit = !submitting && hasAnyContent && !overLimit && !(videoDraft?.busy ?? false);

  return (
    <div
      className={`${styles.wrapper} ${isEmbedded ? styles.wrapperEmbedded : styles.wrapperNormal}`}
      // ▼ 追加: ドラッグ＆ドロップのイベントを外枠に紐付け
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ▼ 追加: ドラッグ中のオーバーレイUI */}
      {isDragging && (
        <div className={styles.dragOverlay} />
      )}

      {userId && userName ? (
        <UserAvatar userId={userId} name={userName} avatarUrl={avatarUrl} size={iconSize} />
      ) : userName ? (
        <Avatar name={userName} size={iconSize} />
      ) : (
        <Avatar name="投稿" size={iconSize} />
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
            {renderComposerHighlight(value)}
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (enableHashtagSuggestions || enableMentionSuggestions) {
                setCaretPos(e.target.selectionStart ?? 0);
                setSuggestDismissed(false);
                setSuggestActiveIndex(0);
              }
            }}
            onKeyUp={(e) => { if (enableHashtagSuggestions || enableMentionSuggestions) setCaretPos(e.currentTarget.selectionStart ?? 0); }}
            onClick={(e) => { if (enableHashtagSuggestions || enableMentionSuggestions) setCaretPos(e.currentTarget.selectionStart ?? 0); }}
            onFocus={() => { if (enableHashtagSuggestions || enableMentionSuggestions) { setFocused(true); setSuggestDismissed(false); } }}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (!showSuggestions) return;
              // IME変換中の Enter 等は確定操作なので横取りしない。
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                setSuggestActiveIndex(prev => {
                  const clamped = Math.min(prev, suggestionCount - 1);
                  return e.key === 'ArrowDown'
                    ? Math.min(clamped + 1, suggestionCount - 1)
                    : Math.max(clamped - 1, 0);
                });
              } else if (e.key === 'Enter' || e.key === 'Tab') {
                // 候補が出ているときは Enter/Tab で確定（改行は挿入しない）。
                e.preventDefault();
                confirmSuggestion(suggestActiveIndex);
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
            <div className={styles.suggestionPopover}>
              {showHashtagSuggestions ? (
                <HashtagSuggestionList
                  suggestions={hashtagSuggestions}
                  activeIndex={Math.min(suggestActiveIndex, hashtagSuggestions.length - 1)}
                  onSelect={selectHashtagSuggestion}
                  onHover={setSuggestActiveIndex}
                />
              ) : (
                <MentionSuggestionList
                  suggestions={mentionSuggestions}
                  activeIndex={Math.min(suggestActiveIndex, mentionSuggestions.length - 1)}
                  onSelect={selectMentionSuggestion}
                  onHover={setSuggestActiveIndex}
                />
              )}
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

        {existingVideoVisible && (
          <div className={styles.existingVideo}>
            <span>動画が付いています（{Math.round((existingVideo?.durationMs ?? 0) / 1000)}秒）</span>
            {onRemoveExistingVideo && (
              <button type="button" className={styles.existingVideoRemove} onClick={onRemoveExistingVideo} disabled={submitting}>
                動画を外す
              </button>
            )}
          </div>
        )}
        {videoDraft && <VideoDraftPanel draft={videoDraft} />}

        {error && <p className={styles.error}>{error}</p>}

        <div className={`${styles.footer} ${large ? styles.footerLarge : styles.footerSmall}`}>
          {canAttach && (
            <input
              ref={fileInputRef}
              type="file"
              multiple /* ← ▼ 追加: ファイル選択ダイアログで複数選択を許可 */
              accept={acceptTypes}
              onChange={handleFileChange}
              className={styles.hiddenInput}
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
          {canAttach && totalMediaCount === 0 && !hasVideo && (
            <button
              type="button"
              className={styles.cameraButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
              title={videoDraft
                ? `写真（最大${MAX_IMAGES}枚）または動画（1本・60秒まで）を追加`
                : `写真を追加 (最大${MAX_IMAGES}枚)`}
            >
              <img src={cameraIcon} alt={videoDraft ? '写真・動画を追加' : '写真を追加'} className={`${styles.cameraIcon} themed-icon`} />
            </button>
          )}
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`${styles.submitButton} ${large ? styles.submitButtonLarge : styles.submitButtonSmall} ${canSubmit ? styles.submitButtonActive : styles.submitButtonDisabled}`}
          >
            {submitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
