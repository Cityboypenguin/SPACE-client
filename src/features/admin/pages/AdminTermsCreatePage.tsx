import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import {
  getPresignedTermsDocumentUploadUrl,
  uploadTermsDocument,
  createTermsOfService,
} from '../api/terms';
import styles from '../styles/AdminShared.module.css';

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
      <main className={styles.formPage}>
        <h1 className={styles.formPageTitle}>
          利用規約バージョン登録
        </h1>

        {error && <p className={styles.formError}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.adminForm}>
          <div>
            <label className={styles.fieldLabel}>
              バージョン番号
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              maxLength={50}
              placeholder="例: 1.0.0"
              className={styles.formInput}
            />
          </div>

          <div>
            <label className={styles.fieldLabel}>
              規約ドキュメント（Markdownファイル）
            </label>
            <div className={styles.fileUploadRow}>
              <input
                type="file"
                accept=".md,.markdown,text/markdown,text/plain"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploadState === 'uploading'}
                className={`${styles.primaryButton} ${uploadState === 'done' ? styles.successButton : ''} ${(!file || uploadState === 'uploading') ? styles.disabled : ''}`}
              >
                {uploadButtonLabel}
              </button>
            </div>
            {uploadState === 'done' && (
              <p className={styles.formSuccessSmall}>
                アップロード完了: {objectKey}
              </p>
            )}
            {uploadState === 'error' && (
              <p className={styles.formErrorSmall}>
                アップロードに失敗しました。再度お試しください。
              </p>
            )}
          </div>

          <div>
            <label className={styles.fieldLabel}>
              施行予定日時
            </label>
            <input
              type="datetime-local"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              min="1000-01-01T00:00"
              max="9999-12-31T23:59"
              className={styles.formInput}
            />
            <p className={styles.formHelp}>
              指定日時以降、このバージョンが有効な最新規約として自動的に適用されます
            </p>
          </div>

          <div className={styles.buttonRow}>
            <button
              type="submit"
              disabled={submitting || uploadState !== 'done'}
              className={`${styles.primaryButtonLargeRounded} ${(submitting || uploadState !== 'done') ? styles.disabled : ''}`}
            >
              {submitting ? '登録中...' : '登録する'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className={styles.secondaryButtonLarge}
            >
              キャンセル
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
