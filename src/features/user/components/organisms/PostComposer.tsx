import { useRef } from 'react';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { Avatar } from '../../../../components/atoms/Avatar';
import { storageUrl } from '../../../../lib/storage';
import { useToast } from '../../../../context/ToastContext';
import cameraIcon from '../../../../assets/パーツ_画像送付.svg';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 4;

// Mediaの型をapi/post.tsから参照できると理想的だが、ここでは最小限の型を定義しておく
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
  selectedFiles?: File[];
  onFileSelect?: (files: File[]) => void;
  existingMedia?: MinimalMedia[];
  deletedMediaIDs?: string[];
  onDeleteExistingMedia?: (id: string) => void;
  onCancel?: () => void;
  cancelLabel?: string;
  isEmbedded?: boolean;
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
  existingMedia = [],
  deletedMediaIDs = [],
  onDeleteExistingMedia,
  onCancel,
  cancelLabel = 'キャンセル',
  isEmbedded = false,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const visibleExistingMedia = existingMedia.filter(m => !deletedMediaIDs.includes(m.ID));
  const totalMediaCount = visibleExistingMedia.length + selectedFiles.length;
  const { addToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      addToast('対応していないファイル形式です。JPEG, PNG, GIF, WEBPのみアップロードできます。', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      addToast('ファイルサイズが大きすぎます。10MB以下の画像をアップロードしてください。', 'error');
      e.target.value = '';
      return;
    }
    if (totalMediaCount >= MAX_IMAGES) return;
    onFileSelect?.([...selectedFiles, file]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    onFileSelect?.(selectedFiles.filter((_, i) => i !== index));
  };

  const hasAnyContent = value.trim() !== '' || totalMediaCount > 0;
  const canSubmit = !submitting && hasAnyContent;

  return (
    <div style={{
      padding: isEmbedded ? '0' : '1rem',
      borderBottom: isEmbedded ? 'none' : '2px solid #e2e8f0',
      display: 'flex',
      gap: '0.75rem'
    }}>
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

        {totalMediaCount > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '6px 0' }}>
            {visibleExistingMedia.map((m) => {
              const isImage = m.contentType.startsWith('image/');
              return (
                <div key={m.ID} style={{ position: 'relative' }}>
                  {isImage ? (
                    <img
                      src={storageUrl(m.url)}
                      alt="既存メディア"
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: 64, height: 64, background: '#e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      FILE
                    </div>
                  )}
                  {onDeleteExistingMedia && (
                    <button
                      type="button"
                      onClick={() => onDeleteExistingMedia(m.ID)}
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
                  )}
                </div>
              );
            })}

            {selectedFiles.map((file, i) => (
              <div key={`new-${i}`} style={{ position: 'relative' }}>
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

            {totalMediaCount < MAX_IMAGES && onFileSelect && (
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

        {/* ⭕️ 一番下のボタン配置エリアを以下のように書き換える */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: rows >= 3 ? '0.5rem' : '0.4rem' }}>

          {/* ----- 左側：写真追加ボタン ----- */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {onFileSelect && totalMediaCount === 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  title={`写真を追加 (最大${MAX_IMAGES}枚)`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                >
                  <img src={cameraIcon} alt="写真を追加" style={{ width: 32, height: 32, filter: 'opacity(0.45)' }} />
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
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                style={{
                  padding: rows >= 3 ? '0.45rem 1rem' : '0.4rem 0.85rem',
                  borderRadius: '20px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: rows >= 3 ? '0.9rem' : '0.85rem',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
              >
                {cancelLabel}
              </button>
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
    </div>
  );
};