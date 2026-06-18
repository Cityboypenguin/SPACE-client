import React, { useState } from 'react';
import { createReport } from '../../api/report';
import { useToast } from '../../../../context/ToastContext';
import { toUserMessage } from '../../../../lib/errorMessages';
import styles from './reportModal.module.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'POST' | 'USER' | 'COMMUNITY';
  targetID: string;
  postContent?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, targetType, targetID, postContent }) => {
  const [reason, setReason] = useState('SPAM');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const title =
    targetType === 'POST' ? '投稿を通報する' :
    targetType === 'USER' ? 'ユーザーを通報する' :
    'コミュニティを通報する';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createReport({
        targetID,
        targetType,
        reason,
        customReason: customReason.trim() || null,
      });
      addToast('通報が送信されました', 'success');
      onClose();
    } catch (err) {
      addToast(toUserMessage(err, '通報の送信に失敗しました。時間をおいてから再度お試しください。'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className={styles.title}>{title}</h2>

        {postContent && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#334155',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '100px',
            overflowY: 'auto',
          }}>
            <span style={{ fontWeight: 600, color: '#64748b', display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>対象の投稿内容:</span>
            {postContent}
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label}>通報理由</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem' }}
          >
            <option value="SPAM">スパム / 宣伝目的</option>
            <option value="HARASSMENT">嫌がらせ / 誹謗中傷</option>
            <option value="INAPPROPRIATE">不適切なコンテンツ</option>
            <option value="COMMUNITY_VIOLATION">コミュニティガイドライン違反</option>
            <option value="OTHER">その他</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>詳細説明（任意）</label>
          <textarea
            className={styles.textarea}
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="詳しい問題の状況を入力してください"
            style={{ minHeight: '80px' }}
          />
        </div>

        <div className={styles.buttonGroup}>
          <button type="button" onClick={onClose} className={styles.cancelButton} disabled={submitting}>
            キャンセル
          </button>
          <button type="submit" className={styles.submitButton} disabled={submitting}>
            {submitting ? '送信中...' : '通報する'}
          </button>
        </div>
      </form>
    </div>
  );
};
