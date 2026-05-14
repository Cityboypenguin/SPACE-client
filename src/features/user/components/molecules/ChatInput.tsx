import { useRef } from 'react';
import styles from '../organisms/chatRoom.module.css';

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
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
};

export const ChatInput = ({ value, onChange, onSubmit, onFileSelect, selectedFiles, disabled }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;

    const invalid = incoming.find((f) => !ACCEPTED_FILE_TYPES.includes(f.type));
    if (invalid) {
      alert('JPEG・PNG・GIF・WebP・PDF のみ送信できます。');
      e.target.value = '';
      return;
    }
    const oversize = incoming.find((f) => f.size > MAX_FILE_SIZE);
    if (oversize) {
      alert('ファイルサイズは 10MB 以下にしてください。');
      e.target.value = '';
      return;
    }
    if (selectedFiles.length >= MAX_FILES) return;
    onFileSelect([...selectedFiles, incoming[0]]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    onFileSelect(selectedFiles.filter((_, i) => i !== index));
  };

  const canSubmit = !disabled && (value.trim() !== '' || selectedFiles.length > 0);

  return (
    <div>
      {selectedFiles.length > 0 && (
        <div style={{ padding: '4px 12px 0', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {selectedFiles.map((file, i) => (
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
                {file.type.startsWith('image/') ? '🖼️' : '📎'} {file.name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.8rem', padding: 0, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={onSubmit} className={styles.inputForm}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || selectedFiles.length >= MAX_FILES}
          title={`ファイルを添付 (${selectedFiles.length}/${MAX_FILES})`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', color: selectedFiles.length >= MAX_FILES ? '#d1d5db' : '#6b7280' }}
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES.join(',')}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="メッセージを入力..."
          disabled={disabled}
          className={styles.inputField}
          autoFocus
        />
        <button type="submit" disabled={!canSubmit}>
          {disabled ? '送信中...' : '送信'}
        </button>
      </form>
    </div>
  );
};
