import React, { useState } from 'react';
import { createReport } from '../../api/report';
import styles from './reportModal.module.css';
import { toUserMessage } from '../../../../lib/errorMessages';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'POST' | 'USER';
  targetID: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, targetType, targetID }) => {
  const [reason, setReason] = useState<string>('SPAM');
  const [customReason, setCustomReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createReport({
        targetType,
        targetID,
        reason,
        customReason: reason === 'CUSTOM' ? customReason : null,
      });

      alert('通報を送信しました。ご協力ありがとうございました。');
      setCustomReason('');
      onClose();
    } catch (err: any) {
      setError(toUserMessage(err, '通報の送信に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>このコンテンツを通報する</h3>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>通報の理由を選んでください：</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input type="radio" value="SPAM" checked={reason === 'SPAM'} onChange={(e) => setReason(e.target.value)} />
                スパム / 宣伝目的
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" value="HARASSMENT" checked={reason === 'HARASSMENT'} onChange={(e) => setReason(e.target.value)} />
                嫌がらせ / 誹謗中傷
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" value="INAPPROPRIATE" checked={reason === 'INAPPROPRIATE'} onChange={(e) => setReason(e.target.value)} />
                不適切なコンテンツ
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" value="CUSTOM" checked={reason === 'CUSTOM'} onChange={(e) => setReason(e.target.value)} />
                その他（理由を自由に記入）
              </label>
            </div>
          </div>

          {reason === 'CUSTOM' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>詳細な理由（必須）：</label>
              <textarea
                className={styles.textarea}
                rows={4}
                placeholder="問題のある部分について詳しく教えてください"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
              />
            </div>
          )}

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={loading}>
              キャンセル
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? '送信中...' : '通報を送信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};