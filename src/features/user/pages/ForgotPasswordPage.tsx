import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset, verifyPasswordResetOTP, resetPassword } from '../api/auth';
import { toUserMessage } from '../../../lib/errorMessages';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { OtpInputSection } from '../components/molecules/OtpInputSection';
import styles from './ForgotPasswordPage.module.css';

type Step = 'email' | 'otp' | 'newPassword' | 'done';

export const ForgotPasswordPage = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorModal, setErrorModal] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setStep('otp');
    } catch (err) {
      setErrorModal(toUserMessage(err, 'エラーが発生しました。時間をおいてから再度お試しください。'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await requestPasswordReset(email);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError('6桁の認証コードを入力してください');
      return;
    }
    setLoading(true);
    setOtpError('');
    try {
      const data = await verifyPasswordResetOTP(email, otp);
      setResetToken(data.verifyPasswordResetOTP);
      setStep('newPassword');
    } catch (err) {
      setOtpError(toUserMessage(err, '認証コードが違います。'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorModal('パスワードが一致しません。');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      setStep('done');
    } catch (err) {
      setErrorModal(toUserMessage(err, 'パスワードの更新に失敗しました。最初からやり直してください。'));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className={styles.page}>
        <div className={styles.body}>
          <p style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '1.5rem' }}>
            パスワードを再設定しました。新しいパスワードでログインしてください。
          </p>
          <button type="button" className={styles.btnPrimary} onClick={() => navigate('/login')}>
            ログインページへ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        {step !== 'newPassword' && (
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => {
              if (step === 'email') navigate('/login');
              else if (step === 'otp') { setStep('email'); setOtp(''); }
            }}
          >
            <ChevronLeft />
          </button>
        )}
        {step === 'email' && <h2 className={styles.pageTitle}>パスワードを再設定する</h2>}
        {step === 'newPassword' && <h2 className={styles.pageTitle}>新規パスワード</h2>}
      </div>

      <div className={styles.body}>
        {/* Email step */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            <div className={styles.card}>
              <label className={styles.fieldLabel}>専修大学メールアドレス</label>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="学籍番号@senshu-u.jp"
                required
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? '送信中...' : '認証コードを送信する'}
            </button>
          </form>
        )}

        {/* OTP step */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit}>
            <OtpInputSection
              email={email}
              otp={otp}
              onOtpChange={(value) => { setOtp(value); setOtpError(''); }}
              otpError={otpError}
              onResend={() => void handleResend()}
              resending={loading}
              warningText="ブラウザの戻るボタンは使わないでください"
            />
            <button type="submit" className={styles.btnPrimary} disabled={loading || otp.length !== 6}>
              {loading ? '確認中...' : '次へ'}
            </button>
          </form>
        )}

        {/* New password step */}
        {step === 'newPassword' && (
          <form onSubmit={handlePasswordSubmit}>
            <div className={styles.card}>
              <label className={styles.fieldLabel}>新規パスワード</label>
              <input
                type="password"
                className={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Value"
                required
              />
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.75rem 0' }} />
              <label className={styles.fieldLabel}>パスワードを再入力</label>
              <input
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Value"
                required
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? '登録中...' : '登録する'}
            </button>
          </form>
        )}
      </div>

      {/* Error modal */}
      {errorModal && (
        <div className={styles.modalOverlay} onClick={() => setErrorModal('')}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalText}>{errorModal}</p>
            <button type="button" className={styles.modalClose} onClick={() => setErrorModal('')}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
