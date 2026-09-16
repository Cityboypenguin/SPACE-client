import { useRef, useEffect, useState } from 'react';
import styles from '../ChatRoom.module.css';
import sendIcon from '../../../../assets/パーツ_送信.svg';
import { useTheme } from '../../../../context/useTheme';
import { MAX_MESSAGE_LENGTH, countMessageLength } from '../../constants/chat';
import { type Message } from '../../api/message';
import { storageUrl } from '../../../../lib/storage';
import { ReplyArrow } from '../../../../components/atoms/ReplyArrow';

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;

// 返信先バーに出す1行プレビュー。本文が無いときは添付の種類で代替する。
const replyPreviewText = (msg: Message): string => {
  if (msg.content.trim() !== '') return msg.content;
  const imageCount = msg.media.filter((m) => m.contentType.startsWith('image/')).length;
  const fileCount = msg.media.length - imageCount;
  if (imageCount > 0) return `画像${imageCount}件`;
  if (fileCount > 0) return `ファイル${fileCount}件`;
  return '';
};

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: { preventDefault(): void }) => void;
  onFileSelect: (files: File[]) => void;
  selectedFiles: File[];
  disabled?: boolean;
  isBlocked?: boolean;
  // 返信中のメッセージ。指定すると入力欄の上に返信先バーを表示する。
  replyTarget?: Message | null;
  onCancelReply?: () => void;
};

export const ChatInput = ({ value, onChange, onSubmit, onFileSelect, selectedFiles, disabled, isBlocked, replyTarget, onCancelReply }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevDisabledRef = useRef(disabled);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (value === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value]);

  // 送信完了後 (disabled: true → false) にテキストエリアへフォーカスを戻す
  useEffect(() => {
    if (prevDisabledRef.current === true && disabled === false) {
      textareaRef.current?.focus();
    }
    prevDisabledRef.current = disabled;
  }, [disabled]);

  // 返信ボタンを押したらそのまま入力できるようフォーカスを移す
  useEffect(() => {
    if (replyTarget) textareaRef.current?.focus();
  }, [replyTarget]);

  useEffect(() => {
    const urls = selectedFiles.map((file) =>
      file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    );
    void Promise.resolve().then(() => setPreviewUrls(urls));
    return () => {
      urls.forEach((url) => { if (url) URL.revokeObjectURL(url); });
    };
  }, [selectedFiles]);

  const addFiles = (incoming: File[]) => {
    const invalid = incoming.find((f) => !ACCEPTED_FILE_TYPES.includes(f.type));
    if (invalid) {
      alert('JPEG・PNG・GIF・WebP・SVG のみ送信できます。');
      return;
    }
    const oversize = incoming.find((f) => f.size > MAX_FILE_SIZE);
    if (oversize) {
      alert('ファイルサイズは 10MB 以下にしてください。');
      return;
    }
    const remaining = MAX_FILES - selectedFiles.length;
    if (remaining <= 0) return;
    onFileSelect([...selectedFiles, ...incoming.slice(0, remaining)]);
    // ファイル選択後にテキストエリアへフォーカスを戻してEnterキーで送信できるようにする
    textareaRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;
    addFiles(incoming);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isBlocked) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isBlocked) return;
    const incoming = Array.from(e.dataTransfer.files);
    if (!incoming.length) return;
    addFiles(incoming);
  };

  const removeFile = (index: number) => {
    onFileSelect(selectedFiles.filter((_, i) => i !== index));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (disabled || isBlocked) return;

    const items = Array.from(e.clipboardData.items);
    const imageFiles = items
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (!imageFiles.length) return;

    e.preventDefault();
    addFiles(imageFiles);
  };

  const replyThumbnail = replyTarget?.media.find((m) => m.contentType.startsWith('image/'));

  const messageLength = countMessageLength(value);
  const isOverLimit = messageLength > MAX_MESSAGE_LENGTH;
  // 上限の90%を超えたあたりから残り文字数を意識してもらうためカウンタを表示する。
  const isNearOrOverLimit = messageLength > MAX_MESSAGE_LENGTH * 0.9;
  const canSubmit = !disabled && !isBlocked && !isOverLimit && (value.trim() !== '' || selectedFiles.length > 0);

  // フォームのnative submit（例: テスト・支援技術等からの直接submit）でも、送信中
  // （disabled）や文字数超過時に親のonSubmitが呼ばれないよう、ここでもcanSubmitを見る。
  // 通常のクリック/Enterキー操作は個別に canSubmit をチェック済みだが、二重送信防止を
  // ボタンのdisabled属性だけに依存させないための最終防波堤。
  const handleFormSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(e);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={styles.chatInputRoot}
    >
      {isDragging && (
        <div
          className={`${styles.dragOverlay} ${styles.dragOverlayBorder}`}
        >
          <span className={styles.dragOverlayText}>
            ここにドロップ
          </span>
        </div>
      )}
      {replyTarget && (
        <div className={styles.replyComposer}>
          <span className={styles.replyComposerIcon}><ReplyArrow /></span>
          <div className={styles.replyComposerBody}>
            <span className={styles.replyComposerLabel}>
              {replyTarget.isMine ? '自分' : replyTarget.user.name}に返信
            </span>
            <span className={styles.replyComposerText}>{replyPreviewText(replyTarget)}</span>
          </div>
          {replyThumbnail && (
            <img src={storageUrl(replyThumbnail.url)} alt="" className={styles.replyComposerThumb} />
          )}
          <button
            type="button"
            onClick={onCancelReply}
            title="返信をやめる"
            className={styles.replyComposerCancel}
          >
            ✕
          </button>
        </div>
      )}
      {selectedFiles.length > 0 && (
        <div className={styles.filePreviewList}>
          {selectedFiles.map((file, i) =>
            file.type.startsWith('image/') ? (
              <div
                key={i}
                className={styles.filePreviewThumb}
              >
                <img
                  src={previewUrls[i]}
                  alt={file.name}
                  className={`${styles.filePreviewImage} ${styles.filePreviewImgBorder}`}
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className={`${styles.fileRemoveButton} ${styles.fileRemoveBtn}`}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                key={i}
                className={`${styles.fileChipInner} ${styles.fileChip}`}
              >
                <span className={styles.fileChipName}>
                  📎 {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className={`${styles.fileChipRemoveButton} ${styles.fileChipRemoveBtn}`}
                >
                  ✕
                </button>
              </div>
            )
          )}
        </div>
      )}
      <form onSubmit={handleFormSubmit} className={styles.inputForm}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isBlocked || selectedFiles.length >= MAX_FILES}
          title={isBlocked ? 'ブロック中のため添付できません' : `ファイルを添付 (${selectedFiles.length}/${MAX_FILES})`}
          className={`${styles.attachButton} ${(disabled || isBlocked || selectedFiles.length >= MAX_FILES) ? styles.attachBtnDisabled : styles.attachBtnEnabled}`}
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES.join(',')}
          onChange={handleFileChange}
          className={styles.hiddenInput}
        />
        <div className={styles.inputFieldWrap}>
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            onChange={(e) => {
              onChange(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              // タッチ操作の端末はソフトウェアキーボードでShift+Enterを押せないため、
              // Enterは改行として扱い、送信は送信ボタンのみで行う。
              // 画面幅ではなくポインタ種別で判定し、PCでウィンドウを小さくしても
              // 通常通りEnterで送信できるようにする。
              const isTouch = window.matchMedia('(pointer: coarse)').matches;
              if (isTouch) return;
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (canSubmit) onSubmit({ preventDefault: () => { } });
              }
            }}
            placeholder={
              isBlocked
                ? 'メッセージを送信できません'
                : window.matchMedia('(pointer: coarse)').matches
                ? 'メッセージを入力...'
                : 'メッセージを入力... (Shift+Enterで改行)'
            }
            disabled={disabled || isBlocked}
            className={styles.inputField}
          />
          {isNearOrOverLimit && (
            <span className={`${styles.charCount} ${isOverLimit ? styles.charCountOver : ''}`}>
              {messageLength}/{MAX_MESSAGE_LENGTH}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          title={isBlocked ? '送信不可' : disabled ? '送信中...' : '送信'}
          className={styles.sendIconButton}
        >
          <img
            src={sendIcon}
            alt="送信"
            className={`${styles.sendIcon} ${!canSubmit ? styles.sendIconDisabled : ''} ${theme === 'dark' ? styles.sendIconDark : ''}`}
          />
        </button>
      </form>
    </div>
  );
};
