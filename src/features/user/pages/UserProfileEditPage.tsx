import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { storageUrl } from '../../../lib/storage';
import { toUserMessage } from '../../../lib/errorMessages';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { ImageCropModal } from '../components/organisms/ImageCropModal';
import { useAuth } from '../context/useAuth';
import { useToast } from '../../../context/useToast';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { profileCacheKey, profileCacheOptions } from '../hooks/useProfile';
import {
  getProfileByUserID,
  updateMyProfileDetails,
  getPresignedAvatarUploadUrl,
  uploadAvatarToStorage,
  setAvatar,
  deleteAvatar,
} from '../api/profile';
import styles from './UserProfileEditPage.module.css';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const accountIDRe = /^[a-zA-Z0-9_-]+$/;
const MAX_NAME_LENGTH = 50;
const MAX_ACCOUNT_ID_LENGTH = 25;

const validateAccountID = (value: string): string => {
  if (!value) return 'ユーザーIDを入力してください';
  if (!accountIDRe.test(value)) return 'ユーザーIDは半角英数字・_・-のみ使用できます';
  if ([...value].length > MAX_ACCOUNT_ID_LENGTH) return `ユーザーIDは${MAX_ACCOUNT_ID_LENGTH}文字以内で入力してください`;
  return '';
};

const validateName = (value: string): string => {
  if (!value) return '名前を入力してください';
  if ([...value].length > MAX_NAME_LENGTH) return `名前は${MAX_NAME_LENGTH}文字以内で入力してください`;
  return '';
};

export const UserProfileEditPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userId } = useAuth();
  const { addToast } = useToast();
  const { mutate } = useSWRConfig();

  const { data: profileData } = useSWR(
    userId ? profileCacheKey(userId) : null,
    ([, id]: [string, string]) => getProfileByUserID(id).then((d) => d.getProfileByUserID),
    profileCacheOptions,
  );

  const [accountID, setAccountID] = useState('');
  const [accountIDError, setAccountIDError] = useState('');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
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
    void Promise.resolve().then(() => {
      setAccountID(profileData.user.accountID);
      setName(profileData.user.name);
      setBio(profileData.bio || '');
      setCurrentAvatarUrl(profileData.avatarUrl);
    });
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

    const trimmedAccountID = accountID.trim();
    const trimmedName = name.trim();
    const accountIDErr = validateAccountID(trimmedAccountID);
    const nameErr = validateName(trimmedName);
    setAccountIDError(accountIDErr);
    setNameError(nameErr);
    if (accountIDErr || nameErr) return;

    setIsUploading(true);

    try {
      if (selectedFile) {
        const { presignedAvatarUploadUrl } = await getPresignedAvatarUploadUrl(selectedFile.type);
        await uploadAvatarToStorage(presignedAvatarUploadUrl.uploadUrl, selectedFile);
        await setAvatar(presignedAvatarUploadUrl.objectKey);
      }

      await updateMyProfileDetails({
        accountID: trimmedAccountID,
        name: trimmedName,
        bio,
      });
      if (userId) await mutate(profileCacheKey(userId));
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
      if (userId) await mutate(profileCacheKey(userId));
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
  const hasChanges = Boolean(
    selectedFile ||
    accountID.trim() !== (profileData?.user.accountID ?? '') ||
    name.trim() !== (profileData?.user.name ?? '') ||
    bio !== (profileData?.bio ?? ''),
  );

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.header}>
          <button onClick={() => navigate(-1)}>
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

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>ユーザー情報</h2>
            <label className={styles.fieldLabel} htmlFor="accountID">ユーザーID</label>
            <input
              id="accountID"
              type="text"
              className={styles.input}
              value={accountID}
              maxLength={MAX_ACCOUNT_ID_LENGTH}
              onChange={(e) => {
                setAccountID(e.target.value);
                setAccountIDError(validateAccountID(e.target.value.trim()));
              }}
              placeholder="ユーザーIDを入力してください"
            />
            {accountIDError && <p className={styles.inlineErrorMsg}>{accountIDError}</p>}

            <label className={styles.fieldLabel} htmlFor="name">名前</label>
            <input
              id="name"
              type="text"
              className={styles.input}
              value={name}
              maxLength={MAX_NAME_LENGTH}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(validateName(e.target.value.trim()));
              }}
              placeholder="名前を入力してください"
            />
            {nameError && <p className={styles.inlineErrorMsg}>{nameError}</p>}
          </section>

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
            <button type="submit" className={styles.submitBtn} disabled={isUploading || !profileData || !hasChanges}>
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
