import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, loginUser, sendEmailOTP } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { getCurrentTerms, consentToTerms, type TermsOfService } from '../api/terms';
import { TermsContent } from '../components/molecules/TermsContent';

// 有効な学科記号（表6より。LG=2020募集停止、LZ=2019募集停止のため除外）
// 2文字コードを E より先に記述して誤マッチを防ぐ
const studentEmailRe = /^(EE|EL|EW|JL|JP|MA|MD|CM|CA|LB|LA|LT|LR|LK|LM|NE|HP|HS|GN|GC|E)(2[0-9]|[3-9][0-9])\d{4}@senshu-u\.jp$/i;

const validateEmail = (value: string): string => {
  if (value && !studentEmailRe.test(value)) {
    return 'メールアドレスは2020年度以降の学籍番号形式のみ登録できます';
  }
  return '';
};

const validatePassword = (value: string): string => {
  if (value && value.length < 8) {
    return 'パスワードは8文字以上で入力してください';
  }
  return '';
};

export const UserRegisterPage = () => {
  const [accountID, setAccountID] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [currentTerms, setCurrentTerms] = useState<TermsOfService | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    getCurrentTerms()
      .then(setCurrentTerms)
      .catch(() => {});
  }, []);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(validateEmail(value));
    if (otpSent) {
      setOtpSent(false);
      setOtp('');
      setOtpError('');
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  const handleSendOTP = async () => {
    const emailErr = validateEmail(email);
    if (emailErr || !email) {
      setEmailError(emailErr || 'メールアドレスを入力してください');
      return;
    }
    setSendingOtp(true);
    setOtpError('');
    try {
      await sendEmailOTP(email);
      setOtpSent(true);
    } catch {
      setOtpError('認証コードの送信に失敗しました。メールアドレスをご確認ください。');
    } finally {
      setSendingOtp(false);
    }
  };

  const hasValidationError = !!emailError || !!passwordError;
  const canSubmit = otpSent && otp.length === 6 && !hasValidationError && (!currentTerms || agreed);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!canSubmit) return;

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    if (emailErr || passwordErr) {
      setEmailError(emailErr);
      setPasswordError(passwordErr);
      return;
    }

    setError('');
    try {
      await registerUser(accountID, name, email, password, otp);
      const loginData = await loginUser(email, password);
      login(loginData.loginUser.token, loginData.loginUser.refreshToken, loginData.loginUser.user.ID);
      if (currentTerms) {
        await consentToTerms(currentTerms.ID);
      }
      navigate('/mypage');
    } catch {
      setError('登録に失敗しました。認証コードが正しいか、入力内容をご確認ください。');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>新規登録</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="text"
        value={accountID}
        onChange={(e) => setAccountID(e.target.value)}
        placeholder="ユーザーID"
        required
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="名前"
        required
      />
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="メールアドレス"
            required
            style={{ width: '100%' }}
          />
          {emailError && <p style={{ color: 'red', fontSize: '0.8rem', margin: '0.2rem 0' }}>{emailError}</p>}
        </div>
        <button
          type="button"
          onClick={handleSendOTP}
          disabled={sendingOtp || !!emailError || !email}
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {sendingOtp ? '送信中...' : otpSent ? '再送信' : '認証コードを送信'}
        </button>
      </div>
      {otpError && <p style={{ color: 'red', fontSize: '0.8rem', margin: '0.2rem 0' }}>{otpError}</p>}
      {otpSent && (
        <div>
          <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.5rem 0 0.3rem' }}>
            {email} に認証コードを送信しました。6桁のコードを入力してください（有効期限10分）。
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="認証コード（6桁）"
            required
          />
        </div>
      )}
      <input
        type="password"
        value={password}
        onChange={(e) => handlePasswordChange(e.target.value)}
        placeholder="パスワード"
        required
      />
      {passwordError && <p style={{ color: 'red', fontSize: '0.8rem', margin: '0.2rem 0' }}>{passwordError}</p>}
      {currentTerms && (
        <div>
          <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0.75rem 0 0.5rem' }}>
            利用規約（バージョン {currentTerms.version}）
          </p>
          <TermsContent
            documentUrl={currentTerms.documentUrl}
            onScrolledToBottom={() => setScrolled(true)}
            onError={() => setTermsError(true)}
            style={{
              height: '200px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '1rem',
              lineHeight: 1.8,
              fontSize: '0.85rem',
              color: '#334155',
            }}
          />
          {!scrolled && !termsError && (
            <p style={{ margin: '0.4rem 0 0.5rem', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
              最後までスクロールして利用規約を確認してください
            </p>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', margin: '0.5rem 0' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={!scrolled || termsError}
            />
            利用規約に同意する
          </label>
        </div>
      )}
      <button type="submit" disabled={!canSubmit}>登録する</button>
      <p>
        すでにアカウントをお持ちの方は<Link to="/login">ログイン</Link>
      </p>
      <p>
        <Link to="/inquiry">お問い合わせ</Link>
      </p>
    </form>
  );
};
