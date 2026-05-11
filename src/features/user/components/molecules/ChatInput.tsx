import { useRef } from 'react';
import styles from '../organisms/chatRoom.module.css';

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: { preventDefault(): void }) => void;
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  disabled?: boolean;
};

export const ChatInput = ({ value, onChange, onSubmit, onFileSelect, selectedFile, disabled }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) { onFileSelect(null); return; }
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      alert('JPEG・PNG・GIF・WebP・PDF のみ送信できます。');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('ファイルサイズは 10MB 以下にしてください。');
      e.target.value = '';
      return;
    }
    onFileSelect(file);
  };

  const canSubmit = !disabled && (value.trim() !== '' || selectedFile !== null);

  return (
    <div>
      {selectedFile && (
        <div style={{ padding: '4px 12px', fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📎 {selectedFile.name}</span>
          <button
            type="button"
            onClick={() => { onFileSelect(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.9rem' }}
          >
            ✕
          </button>
        </div>
      )}
      <form onSubmit={onSubmit} className={styles.inputForm}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="ファイルを添付"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', color: '#6b7280' }}
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
