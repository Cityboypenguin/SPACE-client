import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { createCommunity, getPresignedCommunityIconUploadUrl } from '../api/community';
import { uploadAvatarToStorage } from '../api/profile';
import { toUserMessage } from '../../../lib/errorMessages';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import cameraIconSvg from '../../../assets/パーツ_カメラ.svg';
import styles from './CommunityCreatePage.module.css';

export const CommunityCreatePage = () => {
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('画像サイズは5MB以下にしてください。');
      return;
    }
    setSelectedFile(file);
    setError('');
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    setSubmitting(true);
    setError('');

    let finalIconKey = '';

    try {
      if (selectedFile) {
        const { presignedCommunityIconUploadUrl } = await getPresignedCommunityIconUploadUrl(selectedFile.type);
        const { uploadUrl, objectKey } = presignedCommunityIconUploadUrl;
        await uploadAvatarToStorage(uploadUrl, selectedFile);
        finalIconKey = objectKey;
      }
      await createCommunity(name.trim(), description.trim(), finalIconKey);
      navigate('/community');
    } catch (err) {
      setError(toUserMessage(err, 'コミュニティの作成に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/community')}>
            <ChevronLeft />
          </button>
          <h1 className={styles.title}>コミュニティを作る</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.iconSection}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="プレビュー" className={styles.iconPreview} />
              ) : name.trim() ? (
                <span className={styles.iconInitial}>{[...name.trim()][0]}</span>
              ) : (
                <img src={cameraIconSvg} alt="画像を選択" className={styles.cameraIcon} />
              )}
            </button>
            {selectedFile && (
              <button
                type="button"
                className={styles.removeImageBtn}
                onClick={handleRemoveImage}
              >
                画像を削除
              </button>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>コミュニティ名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="入力してください"
              maxLength={100}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="入力してください"
              maxLength={500}
              required
              rows={4}
              className={styles.textarea}
            />
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button
            type="submit"
            disabled={submitting || !name.trim() || !description.trim()}
            className={styles.submitBtn}
          >
            {submitting ? '作成中...' : '作成する'}
          </button>
        </form>
      </main>
    </div>
  );
};
