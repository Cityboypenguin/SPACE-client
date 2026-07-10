import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../api/auth';
import { toUserMessage } from '../../../lib/errorMessages';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import styles from './ForgotPasswordPage.module.css';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await requestPasswordReset(email);
      setMessage('パスワード再設定用のリンクをメールで送信しました。メールをご確認ください。');
    } catch (err) {
      setError(toUserMessage(err, 'エラーが発生しました。時間をおいてから再度お試しください。'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button type="button" onClick={() => navigate('/login')}>
          <ChevronLeft />
        </button>
        <h2 className={styles.pageTitle}>パスワードを再設定する</h2>
      </div>

      <div className={styles.body}>
        <form onSubmit={handleSubmit}>
          <div className={styles.card}>
            <label className={styles.fieldLabel}>メールアドレス</label>
            <input
              type="text"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
            />
          </div>
          {message && <p className={styles.infoText}>{message}</p>}
          {error && <p className={styles.submitError}>{error}</p>}
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? '送信中...' : 'メールを送信する'}
          </button>
        </form>
      </div>
    </div>
  );
};
