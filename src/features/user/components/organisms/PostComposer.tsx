import { useRef } from 'react';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { Avatar } from '../../../../components/atoms/Avatar';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 4;

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
  selectedFiles?: File[];
  onFileSelect?: (files: File[]) => void;
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
  selectedFiles = [],
  onFileSelect,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;
    const invalid = incoming.find((f) => !ACCEPTED_IMAGE_TYPES.includes(f.type));
    if (invalid) {
      alert('JPEG・PNG・GIF・WebP のみ添付できます。');
      e.target.value = '';
      return;
    }
    const oversize = incoming.find((f) => f.size > MAX_FILE_SIZE);
    if (oversize) {
      alert('ファイルサイズは 10MB 以下にしてください。');
      e.target.value = '';
      return;
    }
    if (selectedFiles.length >= MAX_IMAGES) return;
    onFileSelect?.([...selectedFiles, incoming[0]]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    onFileSelect?.(selectedFiles.filter((_, i) => i !== index));
  };

  const canSubmit = !submitting && (value.trim() !== '' || selectedFiles.length > 0);

  return (
    <div style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', display: 'flex', gap: '0.75rem' }}>
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
      <div style={{ flex: 1 }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{
            width: '100%', border: 'none', borderBottom: '1px solid #e2e8f0',
            outline: 'none', resize: 'none',
            fontSize: rows >= 3 ? '1.05rem' : '0.95rem',
            color: '#1e293b', background: 'transparent',
            padding: '0.25rem 0', boxSizing: 'border-box',
          }}
        />

        {selectedFiles.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '6px 0' }}>
            {selectedFiles.map((file, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#374151', border: 'none',
                    color: '#fff', fontSize: '0.65rem',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    padding: 0, lineHeight: 1,
                  }}
                >✕</button>
              </div>
            ))}
            {selectedFiles.length < MAX_IMAGES && onFileSelect && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 64, height: 64, borderRadius: 8,
                  border: '2px dashed #d1d5db', background: '#f9fafb',
                  color: '#9ca3af', fontSize: '1.5rem',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >+</button>
            )}
          </div>
        )}

        {error && <p style={{ color: 'red', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: rows >= 3 ? '0.5rem' : '0.4rem' }}>
          {onFileSelect && selectedFiles.length === 0 ? (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                title={`写真を追加 (最大${MAX_IMAGES}枚)`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#6b7280', padding: '0 4px' }}
              >
                🖼️
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </>
          ) : onFileSelect ? (
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
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
              color: '#fff', border: 'none', fontWeight: 700,
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
