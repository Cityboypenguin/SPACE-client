import { useRef, useEffect, useState } from 'react';
import styles from '../organisms/chatRoom.module.css';

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: { preventDefault(): void }) => void;
  onFileSelect: (files: File[]) => void;
  selectedFiles: File[];
  disabled?: boolean;
  isBlocked?: boolean;
};

export const ChatInput = ({ value, onChange, onSubmit, onFileSelect, selectedFiles, disabled, isBlocked }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (value === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value]);

  useEffect(() => {
    const urls = selectedFiles.map((file) =>
      file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    );
    setPreviewUrls(urls);
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

  const canSubmit = !disabled && !isBlocked && (value.trim() !== '' || selectedFiles.length > 0);

  const getButtonText = () => {
    if (isBlocked) return '送信不可';
    if (disabled) return '送信中...';
    return '送信';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: 'relative' }}
    >
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
          <span style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: 500 }}>
            ここにドロップ
          </span>
        </div>
      )}
      {selectedFiles.length > 0 && (
        <div style={{ padding: '4px 12px 0', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selectedFiles.map((file, i) =>
            file.type.startsWith('image/') ? (
              <div
                key={i}
                style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}
              >
                <img
                  src={previewUrls[i]}
                  alt={file.name}
                  style={{
                    width: 56,
                    height: 56,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    display: 'block',
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#6b7280',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  fontSize: '0.75rem',
                  color: '#374151',
                  maxWidth: 160,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📎 {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.8rem', padding: 0, flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
            )
          )}
        </div>
      )}
      <form onSubmit={onSubmit} className={styles.inputForm}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isBlocked || selectedFiles.length >= MAX_FILES}
          title={isBlocked ? 'ブロック中のため添付できません' : `ファイルを添付 (${selectedFiles.length}/${MAX_FILES})`}
          style={{
            background: 'none',
            border: 'none',
            cursor: (disabled || isBlocked || selectedFiles.length >= MAX_FILES) ? 'default' : 'pointer',
            fontSize: '1.2rem',
            padding: '0 4px',
            color: (disabled || isBlocked || selectedFiles.length >= MAX_FILES) ? '#d1d5db' : '#6b7280'
          }}
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES.join(',')}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          onChange={(e) => {
            onChange(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (canSubmit) onSubmit({ preventDefault: () => { } });
            }
          }}
          placeholder={isBlocked ? 'メッセージを送信できません' : 'メッセージを入力... (Shift+Enterで改行)'}
          disabled={disabled || isBlocked}
          className={styles.inputField}
          style={{ cursor: (disabled || isBlocked) ? 'default' : 'text' }}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          style={{ cursor: !canSubmit ? 'default' : 'pointer' }}
        >
          {getButtonText()}
        </button>
      </form>
    </div>
  );
};
