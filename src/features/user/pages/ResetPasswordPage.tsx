import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { toUserMessage } from '../../../lib/errorMessages';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import styles from './ForgotPasswordPage.module.css';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const resetToken = searchParams.get('token') ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setError('リセットトークンがありません。メールのリンクからやり直してください。');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError('新しいパスワードを入力してください。');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      await resetPassword(resetToken, newPassword);
      setMessage('パスワードを再設定しました。新しいパスワードでログインしてください。');
    } catch (err) {
      setError(toUserMessage(err, 'パスワードの更新に失敗しました。最初からやり直してください。'));
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
        <h2 className={styles.pageTitle}>新しいパスワードを入力</h2>
      </div>

      <div className={styles.body}>
        <form onSubmit={handleSubmit}>
          <div className={styles.card}>
            <label className={styles.fieldLabel}>新しいパスワード</label>
            <input
              type="password"
              className={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新しいパスワード"
            />
            <label className={styles.fieldLabel} style={{ marginTop: '1rem' }}>
              パスワードを再入力
            </label>
            <input
              type="password"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="確認用"
            />
          </div>
          {message && <p className={styles.infoText}>{message}</p>}
          {error && <p className={styles.warningText}>{error}</p>}
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? '更新中...' : 'パスワードを更新する'}
          </button>
        </form>
      </div>
    </div>
  );
};
