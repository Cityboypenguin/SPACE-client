import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { createCommunity, getPresignedCommunityIconUploadUrl } from '../api/community';
import { uploadAvatarToStorage } from '../api/profile';
import { CommunityAvatar } from '../../../components/atoms/CommunityAvatar';
import { toUserMessage } from '../../../lib/errorMessages';

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
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    setSubmitting(true);
    setError('');

    let finalIconKey: string | null = null;

    try {
      if (selectedFile) {
    const { presignedCommunityIconUploadUrl } = await getPresignedCommunityIconUploadUrl(selectedFile.type);
    const { uploadUrl, objectKey } = presignedCommunityIconUploadUrl;
    await uploadAvatarToStorage(uploadUrl, selectedFile);
    finalIconKey = objectKey;
  }
  await createCommunity(name.trim(), description.trim(), finalIconKey ?? "");
  
  navigate('/community');
    } catch (err) {
      setError(toUserMessage(err, 'コミュニティの作成に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <UserHeader />
      <main style={{ padding: '2rem', maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/community')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#646cff', fontWeight: 600, padding: 0 }}
          >
            ← 戻る
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>コミュニティを作成</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <CommunityAvatar name={name || 'C'} src={previewUrl} size={60} />
            <div>
              <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '0.4rem' }}>コミュニティアイコン</div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}
              >
                画像を選択する
              </button>
              {selectedFile && <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>{selectedFile.name}</span>}
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#334155' }}>
              コミュニティ名 <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: デザイン研究会"
              maxLength={100}
              required
              style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#334155' }}>
              説明 <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="このコミュニティについて説明してください"
              maxLength={500}
              required
              rows={4}
              style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              {description.length} / 500
            </div>
          </div>

          {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting || !name.trim() || !description.trim()}
            style={{
              padding: '0.7rem',
              borderRadius: '8px',
              background: submitting || !name.trim() || !description.trim() ? '#94a3b8' : '#646cff',
              color: '#fff',
              border: 'none',
              cursor: submitting || !name.trim() || !description.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            {submitting ? '作成中...' : 'コミュニティを作成'}
          </button>
        </form>
      </main>
    </div>
  );
};