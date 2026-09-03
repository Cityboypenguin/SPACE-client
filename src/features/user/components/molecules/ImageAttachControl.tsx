import { useEffect, useRef, useState } from 'react';
import { useToast } from '../../../../context/ToastContext';
import cameraIcon from '../../../../assets/パーツ_画像送付.svg';
import styles from '../QuestionBox.module.css';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_IMAGES = 4;

type Props = {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
};

type ToastFn = (message: string, type: 'error') => void;

// 投稿(PostComposer)の画像添付と同じ制限(最大4枚・対応形式・10MB)で写真を追加する。
const validateAndAdd = (files: File[], incoming: File[], onFilesChange: (files: File[]) => void, addToast: ToastFn) => {
  if (files.length + incoming.length > MAX_IMAGES) {
    addToast(`写真は最大${MAX_IMAGES}枚まで添付できます。`, 'error');
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
  onFilesChange([...files, ...incoming]);
};

// 写真がまだ0枚のときに、フッターの送信ボタンの隣に表示するカメラボタン
// (投稿と同じく、1枚以上添付された後は ImageAttachPreviews 側の「+」タイルに役割を譲る)。
export const ImageAttachButton = ({ files, onFilesChange, disabled }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  if (files.length > 0) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (incoming.length) validateAndAdd(files, incoming, onFilesChange, addToast);
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        className={styles.cameraButton}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        title={`写真を追加(最大${MAX_IMAGES}枚)`}
      >
        <img src={cameraIcon} alt="写真を追加" className={`${styles.cameraIcon} themed-icon`} />
      </button>
    </>
  );
};

// 1枚以上添付されているときに、テキストエリアとフッターの間に独立した行として
// 表示するサムネイル一覧(投稿と同じ配置。テキストエリアと幅を奪い合わないようにする)。
export const ImageAttachPreviews = ({ files, onFilesChange, disabled }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlCacheRef = useRef<Map<File, string>>(new Map());
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    const cache = previewUrlCacheRef.current;
    const selectedSet = new Set(files);
    for (const [file, url] of cache) {
      if (!selectedSet.has(file)) {
        URL.revokeObjectURL(url);
        cache.delete(file);
      }
    }
    setPreviewUrls(files.map((file) => {
      const cached = cache.get(file);
      if (cached) return cached;
      const url = URL.createObjectURL(file);
      cache.set(file, url);
      return url;
    }));
  }, [files]);

  useEffect(() => () => {
    previewUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlCacheRef.current.clear();
  }, []);

  if (files.length === 0) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (incoming.length) validateAndAdd(files, incoming, onFilesChange, addToast);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.mediaPreviewRow}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {files.map((file, i) => (
        <div key={i} className={styles.mediaThumb}>
          {previewUrls[i] && <img src={previewUrls[i]} alt={file.name} className={styles.mediaThumbImg} />}
          <button type="button" className={styles.mediaThumbRemove} onClick={() => removeFile(i)} disabled={disabled}>✕</button>
        </div>
      ))}
      {files.length < MAX_IMAGES && (
        <button
          type="button"
          className={styles.addMoreButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="写真を追加"
        >
          +
        </button>
      )}
    </div>
  );
};
