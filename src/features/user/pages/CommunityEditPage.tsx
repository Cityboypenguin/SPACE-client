import { useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mutate } from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { updateCommunityInfo, getPresignedCommunityIconUploadUrl, type Community } from '../api/community';
import { uploadAvatarToStorage } from '../api/profile';
import { storageUrl } from '../../../lib/storage';
import { toUserMessage } from '../../../lib/errorMessages';
import { CommunityAvatar } from '../../../components/atoms/CommunityAvatar';
import styles from './CommunityEditPage.module.css';

export const CommunityEditPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { community: Community; returnPath?: string } | null;
  const community = state?.community;
  const returnPath = state?.returnPath;

  const [name, setName] = useState(community?.name ?? '');
  const [description, setDescription] = useState(community?.description ?? '');

  const hasValidAvatar = community?.avatarURL && community.avatarURL !== '' && !community.avatarURL.includes('none');
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    hasValidAvatar ? (storageUrl(community!.avatarURL) ?? null) : null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isIconDeleted, setIsIconDeleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges = useMemo(() => {
    if (!community) return false;
    return (
      name !== community.name ||
      description !== community.description ||
      selectedFile !== null ||
      isIconDeleted
    );
  }, [name, description, selectedFile, isIconDeleted, community]);

  if (!community) {
    navigate('/community', { replace: true });
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('画像サイズは5MB以下にしてください。'); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsIconDeleted(false);
    setError('');
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsIconDeleted(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      let avatarKey: string | undefined;
      if (selectedFile) {
        const { presignedCommunityIconUploadUrl } = await getPresignedCommunityIconUploadUrl(selectedFile.type);
        await uploadAvatarToStorage(presignedCommunityIconUploadUrl.uploadUrl, selectedFile);
        avatarKey = presignedCommunityIconUploadUrl.objectKey;
      } else if (isIconDeleted) {
        avatarKey = 'none';
      }
      const input: { name?: string; description?: string; avatarKey?: string } = {};
      if (name !== community.name) input.name = name;
      if (description !== community.description) input.description = description;
      if (avatarKey !== undefined) input.avatarKey = avatarKey;
      await updateCommunityInfo(community.ID, input);
      await mutate('my-communities');
      if (returnPath) {
        navigate(returnPath, { state: { showDetail: true } });
      } else {
        navigate(-1);
      }
    } catch (err) {
      setError(toUserMessage(err, 'コミュニティ情報の更新に失敗しました。'));
    } finally {
      setSaving(false);
    }
  };

  const doNavigateBack = () => {
    if (returnPath) {
      navigate(returnPath, { state: { showDetail: true } });
    } else {
      navigate(-1);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      doNavigateBack();
    }
  };

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={handleBack}>
            <ChevronLeft />
          </button>
        </div>

        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.topRow}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div className={styles.iconCol}>
              <div
                className={styles.iconClickable}
                onClick={() => fileInputRef.current?.click()}
              >
                <CommunityAvatar name={name} directSrc={previewUrl} size={120} />
              </div>
              {previewUrl && (
                <button type="button" className={styles.removeBtn} onClick={handleRemoveImage}>
                  画像を削除
                </button>
              )}
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="コミュニティ名"
              maxLength={100}
              required
              className={styles.nameInput}
            />
          </div>

          <div className={styles.descField}>
            <label className={styles.descLabel}>紹介文</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="コミュニティの紹介文を入力してください"
              maxLength={500}
              rows={5}
              className={styles.textarea}
            />
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.footer}>
            <button type="submit" disabled={saving || !name.trim()} className={styles.saveBtn}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>

        {showDiscardConfirm && (
          <div className={styles.discardOverlay}>
            <div className={styles.discardDialog}>
              <p className={styles.discardMessage}>変更を破棄しますか？</p>
              <div className={styles.discardActions}>
                <button className={styles.discardCancelBtn} onClick={() => setShowDiscardConfirm(false)}>
                  キャンセル
                </button>
                <button className={styles.discardConfirmBtn} onClick={doNavigateBack}>
                  破棄する
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
