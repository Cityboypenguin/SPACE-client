import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { storageUrl } from '../../../lib/storage';
import { toUserMessage } from '../../../lib/errorMessages';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { ImageCropModal } from '../components/organisms/ImageCropModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import {
  getProfileByUserID,
  updateProfile,
  getPresignedAvatarUploadUrl,
  uploadAvatarToStorage,
  setAvatar,
  deleteAvatar,
} from '../api/profile';
import styles from './UserProfileEditPage.module.css';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const UserProfileEditPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userId } = useAuth();
  const { addToast } = useToast();

  const { data: profileData } = useSWR(
    userId ? ['profile', userId] : null,
    ([, id]: [string, string]) => getProfileByUserID(id).then((d) => d.getProfileByUserID),
  );

  const [bio, setBio] = useState('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropTarget, setCropTarget] = useState<{ imageSrc: string; file: File } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profileData) return;
    setBio(profileData.bio || '');
    setCurrentAvatarUrl(profileData.avatarUrl);
  }, [profileData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('JPEG、PNG、WebP、GIF のみアップロードできます。');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('ファイルサイズは 5MB 以下にしてください。');
      return;
    }

    setError('');

    if (file.type === 'image/svg+xml') {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setCropTarget({ imageSrc: URL.createObjectURL(file), file });
    }
    e.target.value = '';
  };

  const handleCropComplete = (croppedFile: File, croppedPreviewUrl: string) => {
    setSelectedFile(croppedFile);
    setPreviewUrl(croppedPreviewUrl);
    setCropTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsUploading(true);

    try {
      if (selectedFile) {
        const { presignedAvatarUploadUrl } = await getPresignedAvatarUploadUrl(selectedFile.type);
        await uploadAvatarToStorage(presignedAvatarUploadUrl.uploadUrl, selectedFile);
        await setAvatar(presignedAvatarUploadUrl.objectKey);
      }

      await updateProfile({ bio });
      addToast('プロフィールを更新しました', 'success');
      navigate('/mypage');
    } catch (err) {
      setError(toUserMessage(err, 'プロフィールの更新に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setError('');
    setIsDeletingAvatar(true);
    try {
      await deleteAvatar();
      setCurrentAvatarUrl(null);
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (err) {
      setError(toUserMessage(err, 'アイコンの削除に失敗しました。'));
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const displayAvatarUrl = previewUrl ?? currentAvatarUrl;

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft />
          </button>
          <h1 className={styles.title}>プロフィール編集</h1>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.avatarSection}>
            <div
              className={styles.avatarCircle}
              onClick={() => fileInputRef.current?.click()}
            >
              {displayAvatarUrl ? (
                <img
                  src={storageUrl(displayAvatarUrl) ?? undefined}
                  alt="アバター"
                  className={styles.avatarImg}
                />
              ) : (
                <span className={styles.avatarPlaceholder}>＋</span>
              )}
            </div>
            <div className={styles.avatarActions}>
              <button
                type="button"
                className={`${styles.avatarBtn} ${styles.avatarBtnChange}`}
                onClick={() => fileInputRef.current?.click()}
              >
                画像を変更
              </button>
              {displayAvatarUrl && (
                <button
                  type="button"
                  className={`${styles.avatarBtn} ${styles.avatarBtnDelete}`}
                  onClick={handleDeleteAvatar}
                  disabled={isDeletingAvatar}
                >
                  {isDeletingAvatar ? '削除中...' : 'アイコンを削除'}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className={styles.bioSection}>
            <label className={styles.fieldLabel} htmlFor="bio">自己紹介</label>
            <textarea
              id="bio"
              className={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="自己紹介を入力してください"
            />
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.submitWrap}>
            <button type="submit" className={styles.submitBtn} disabled={isUploading}>
              {isUploading ? '更新中...' : '更新する'}
            </button>
          </div>
        </form>
      </main>

      {cropTarget && (
        <ImageCropModal
          imageSrc={cropTarget.imageSrc}
          fileName={cropTarget.file.name}
          mimeType={cropTarget.file.type}
          onCancel={() => setCropTarget(null)}
          onComplete={handleCropComplete}
        />
      )}
    </div>
  );
};
