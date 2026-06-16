import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordReset, verifyPasswordResetOTP, resetPassword } from '../api/auth';
import { toUserMessage } from '../../../lib/errorMessages';

type Step = 'email' | 'otp' | 'newPassword' | 'done';

export const ForgotPasswordPage = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setStep('otp');
    } catch (err) {
      setError(toUserMessage(err, 'エラーが発生しました。時間をおいてから再度お試しください。'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await verifyPasswordResetOTP(email, otp);
      setResetToken(data.verifyPasswordResetOTP);
      setStep('newPassword');
    } catch (err) {
      setError(toUserMessage(err, '認証コードの確認に失敗しました。'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      setStep('done');
    } catch (err) {
      setError(toUserMessage(err, 'パスワードの更新に失敗しました。最初からやり直してください。'));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div>
        <h2>パスワードを再設定しました</h2>
        <p>新しいパスワードでログインしてください。</p>
        <button type="button" onClick={() => navigate('/login')}>ログインページへ</button>
      </div>
    );
  }

  return (
    <div>
      {step === 'email' && (
        <form onSubmit={handleEmailSubmit}>
          <h2>パスワードを忘れた方へ</h2>
          <p style={{ fontSize: '0.9rem', color: '#475569' }}>
            登録済みのメールアドレスを入力してください。認証コードをお送りします。
          </p>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? '送信中...' : '認証コードを送信'}
          </button>
          <p>
            <Link to="/login">ログインに戻る</Link>
          </p>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit}>
          <h2>認証コードを入力</h2>
          <p style={{ fontSize: '0.9rem', color: '#475569' }}>
            {email} に送信された6桁の認証コードを入力してください。
          </p>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="認証コード（6桁）"
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]{6}"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? '確認中...' : '認証コードを確認'}
          </button>
          <p>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
              onClick={() => { setStep('email'); setOtp(''); setError(''); }}
            >
              メールアドレスを再入力する
            </button>
          </p>
        </form>
      )}

      {step === 'newPassword' && (
        <form onSubmit={handlePasswordSubmit}>
          <h2>新しいパスワードを設定</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="新しいパスワード"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="新しいパスワード（確認）"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? '更新中...' : 'パスワードを更新'}
          </button>
        </form>
      )}
    </div>
  );
};
