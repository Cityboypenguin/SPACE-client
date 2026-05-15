import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { storageUrl } from '../../../lib/storage';
import { UserHeader } from '../components/organisms/UserHeader';
import {
  getMyProfile,
  getProfileByUserID,
  updateProfile,
  getPresignedAvatarUploadUrl,
  uploadAvatarToStorage,
  setAvatar,
} from '../api/profile';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const UserProfileEditPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await getMyProfile();
        const myUserID = meRes.me.ID;

        const profileRes = await getProfileByUserID(myUserID);
        const profile = profileRes.getProfileByUserID;
        if (profile) {
          setBio(profile.bio || '');
          setCurrentAvatarUrl(profile.avatarUrl);
        }
      } catch (err) {
        setError('プロフィールの取得に失敗しました');
        console.error(err);
      }
    };
    void init();
  }, []);

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
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
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
      navigate('/mypage', { state: { message: 'プロフィールを更新しました！' } });
    } catch (err) {
      setError('更新に失敗しました。');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const displayAvatarUrl = previewUrl ?? currentAvatarUrl;

  return (
    <div>
      <UserHeader />
      <main style={{ padding: '2rem' }}>
        <h1>プロフィール編集</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 400 }}>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #94a3b8',
              }}
            >
              {displayAvatarUrl ? (
                <img src={storageUrl(displayAvatarUrl) ?? undefined} alt="アバター" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2rem', color: '#94a3b8' }}>＋</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: '0.875rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              画像を変更
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            自己紹介:
            <textarea
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </label>

          <button type="submit" disabled={isUploading}>
            {isUploading ? '更新中...' : '更新'}
          </button>
        </form>

        {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
        <Link to="/mypage" style={{ marginTop: '1rem', display: 'inline-block' }}>マイページに戻る</Link>
      </main>
    </div>
  );
};
