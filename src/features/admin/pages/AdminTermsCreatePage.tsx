import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import {
  getPresignedTermsDocumentUploadUrl,
  uploadTermsDocument,
  createTermsOfService,
} from '../api/terms';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export const AdminTermsCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [version, setVersion] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [objectKey, setObjectKey] = useState('');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setObjectKey('');
    setUploadState('idle');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadState('uploading');
    setError('');
    try {
      const { uploadUrl, objectKey: key } = await getPresignedTermsDocumentUploadUrl();
      await uploadTermsDocument(uploadUrl, file);
      setObjectKey(key);
      setUploadState('done');
    } catch {
      setUploadState('error');
      setError('ファイルのアップロードに失敗しました');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || !objectKey || !effectiveDate) {
      setError('すべての項目を入力し、ファイルをアップロードしてください');
      return;
    }
    if (!window.confirm('この利用規約バージョンを登録しますか？')) return;
    setSubmitting(true);
    setError('');
    try {
      const effectiveDateISO = new Date(effectiveDate).toISOString();
      await createTermsOfService(version.trim(), objectKey, effectiveDateISO);
      navigate('/admin');
    } catch {
      setError('利用規約の登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadButtonLabel =
    uploadState === 'uploading' ? 'アップロード中...' :
    uploadState === 'done' ? '再アップロード' :
    'アップロード';

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          利用規約バージョン登録
        </h1>

        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              バージョン番号
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              maxLength={50}
              placeholder="例: 1.0.0"
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              規約ドキュメント（Markdownファイル）
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="file"
                accept=".md,.markdown,text/markdown,text/plain"
                onChange={handleFileChange}
                style={{ flex: 1, fontSize: '0.9rem' }}
              />
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploadState === 'uploading'}
                style={{
                  padding: '0.5rem 1rem',
                  background: uploadState === 'done' ? '#10b981' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: !file || uploadState === 'uploading' ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  opacity: !file || uploadState === 'uploading' ? 0.6 : 1,
                }}
              >
                {uploadButtonLabel}
              </button>
            </div>
            {uploadState === 'done' && (
              <p style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.4rem' }}>
                アップロード完了: {objectKey}
              </p>
            )}
            {uploadState === 'error' && (
              <p style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.4rem' }}>
                アップロードに失敗しました。再度お試しください。
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              施行予定日時
            </label>
            <input
              type="datetime-local"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>
              指定日時以降、このバージョンが有効な最新規約として自動的に適用されます
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={submitting || uploadState !== 'done'}
              style={{
                padding: '0.6rem 1.5rem',
                background: submitting || uploadState !== 'done' ? '#93c5fd' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: submitting || uploadState !== 'done' ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              {submitting ? '登録中...' : '登録する'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{
                padding: '0.6rem 1.5rem',
                background: '#fff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              キャンセル
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
