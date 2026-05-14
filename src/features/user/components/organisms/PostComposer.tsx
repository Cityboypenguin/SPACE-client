import { useRef } from 'react';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { Avatar } from '../../../../components/atoms/Avatar';

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
  selectedFile?: File | null;
  onFileSelect?: (file: File | null) => void;
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
  selectedFile,
  onFileSelect,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) { onFileSelect?.(null); return; }
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      alert('JPEG・PNG・GIF・WebP・PDF のみ添付できます。');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('ファイルサイズは 10MB 以下にしてください。');
      e.target.value = '';
      return;
    }
    onFileSelect?.(file);
  };

  const canSubmit = !submitting && (value.trim() !== '' || !!selectedFile);

  return (
    <div style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', display: 'flex', gap: '0.75rem' }}>
      {userId && userName ? (
        <UserAvatar userId={userId} name={userName} avatarUrl={avatarUrl} size={iconSize} />
      ) : userName ? (
        <Avatar name={userName} size={iconSize} />
      ) : (
        <div
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#646cff,#a78bfa)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: iconSize >= 40 ? '1.2rem' : '1rem',
            flexShrink: 0,
          }}
        >
          ✍️
        </div>
      )}
      <div style={{ flex: 1 }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{
            width: '100%',
            border: 'none',
            borderBottom: '1px solid #e2e8f0',
            outline: 'none',
            resize: 'none',
            fontSize: rows >= 3 ? '1.05rem' : '0.95rem',
            color: '#1e293b',
            background: 'transparent',
            padding: '0.25rem 0',
            boxSizing: 'border-box',
          }}
        />

        {selectedFile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: '0.8rem', color: '#6b7280' }}>
            <span>📎 {selectedFile.name}</span>
            <button
              type="button"
              onClick={() => {
                onFileSelect?.(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.9rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <p style={{ color: 'red', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{error}</p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: rows >= 3 ? '0.5rem' : '0.4rem' }}>
          {onFileSelect ? (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                title="ファイルを添付"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#6b7280', padding: '0 4px' }}
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
            </>
          ) : (
            <div />
          )}
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            style={{
              padding: rows >= 3 ? '0.45rem 1.2rem' : '0.4rem 1rem',
              borderRadius: '20px',
              background: canSubmit ? '#646cff' : '#c7d2fe',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: rows >= 3 ? '0.9rem' : '0.85rem',
              cursor: canSubmit ? 'pointer' : 'default',
              transition: 'background 0.1s',
            }}
          >
            {submitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
