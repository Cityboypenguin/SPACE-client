import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, loginUser, sendEmailOTP } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { getCurrentTerms, consentToTerms, type TermsOfService } from '../api/terms';
import { TermsContent } from '../components/molecules/TermsContent';

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

type Step = 1 | 2;

const STEP_LABELS: Record<Step, string> = {
  1: '情報入力',
  2: 'メール認証',
};

const StepIndicator = ({ current }: { current: Step }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
    {([1, 2] as Step[]).map((s, i) => (
      <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
        {i > 0 && (
          <div style={{
            width: 40,
            height: 2,
            background: current > s ? '#3b82f6' : '#e2e8f0',
          }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            background: current === s ? '#3b82f6' : current > s ? '#93c5fd' : '#e2e8f0',
            color: current >= s ? '#fff' : '#94a3b8',
          }}>
            {current > s ? '✓' : s}
          </div>
          <span style={{
            fontSize: '0.7rem',
            color: current === s ? '#3b82f6' : '#94a3b8',
            whiteSpace: 'nowrap',
          }}>
            {STEP_LABELS[s]}
          </span>
        </div>
      </div>
    ))}
  </div>
);

export const UserRegisterPage = () => {
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [accountID, setAccountID] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [currentTerms, setCurrentTerms] = useState<TermsOfService | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [termsError, setTermsError] = useState(false);

  // Step 2
  const [otp, setOtp] = useState('');
  const [submitError, setSubmitError] = useState('');

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
      setOtpError('');
    }
  };

  const handleSendOTP = async () => {
    const err = validateEmail(email);
    if (err || !email) {
      setEmailError(err || 'メールアドレスを入力してください');
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

  const [step1Errors, setStep1Errors] = useState<string[]>([]);

  const handleStep1Next = () => {
    const errors: string[] = [];
    if (!otpSent) errors.push('認証コードをメールアドレスに送信してください');
    if (!accountID) errors.push('ユーザーIDを入力してください');
    if (!name) errors.push('名前を入力してください');
    if (!password) errors.push('パスワードを入力してください');
    else if (passwordError) errors.push(passwordError);
    if (currentTerms && !agreed) errors.push('利用規約に同意してください');
    if (errors.length > 0) {
      setStep1Errors(errors);
      return;
    }
    setStep1Errors([]);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (otp.length !== 6) return;
    setSubmitError('');
    try {
      await registerUser(accountID, name, email, password, otp);
      const loginData = await loginUser(email, password);
      login(loginData.loginUser.token, loginData.loginUser.refreshToken, loginData.loginUser.user.ID);
      if (currentTerms) {
        await consentToTerms(currentTerms.ID);
      }
      navigate('/mypage');
    } catch {
      setSubmitError('登録に失敗しました。認証コードが正しいか確認してください。');
    }
  };

  return (
    <div>
      <h2>新規登録</h2>
      <StepIndicator current={step} />

      {step === 1 && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="大学メールアドレス"
                style={{ width: '100%' }}
              />
              {emailError && (
                <p style={{ color: 'red', fontSize: '0.8rem', margin: '0.2rem 0' }}>{emailError}</p>
              )}
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
          {otpSent && (
            <p style={{ fontSize: '0.8rem', color: '#22c55e', margin: '0.3rem 0 0' }}>
              認証コードを送信しました。メールをご確認ください。
            </p>
          )}
          {otpError && (
            <p style={{ color: 'red', fontSize: '0.8rem', margin: '0.2rem 0' }}>{otpError}</p>
          )}

          <input
            type="text"
            value={accountID}
            onChange={(e) => setAccountID(e.target.value)}
            placeholder="ユーザーID"
            style={{ marginTop: '0.75rem' }}
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前"
          />
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(validatePassword(e.target.value));
              }}
              placeholder="パスワード"
            />
            {passwordError && (
              <p style={{ color: 'red', fontSize: '0.8rem', margin: '0.2rem 0' }}>{passwordError}</p>
            )}
          </div>

          {currentTerms && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 0.5rem' }}>
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
                  disabled={!scrolled && !termsError}
                />
                利用規約に同意する
              </label>
            </div>
          )}

          {step1Errors.length > 0 && (
            <ul style={{ color: 'red', fontSize: '0.85rem', margin: '0.75rem 0 0', paddingLeft: '1.2rem' }}>
              {step1Errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
          <button
            type="button"
            onClick={handleStep1Next}
            style={{ marginTop: '0.75rem', width: '100%' }}
          >
            次へ →
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 0.75rem' }}>
            <strong>{email}</strong> に送信した6桁の認証コードを入力してください（有効期限10分）。
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="認証コード（6桁）"
            style={{ letterSpacing: '0.3rem', fontSize: '1.2rem', textAlign: 'center' }}
          />
          {submitError && <p style={{ color: 'red', margin: '0.5rem 0' }}>{submitError}</p>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => { setStep(1); setOtp(''); setSubmitError(''); }} style={{ flex: 1 }}>
              ← 戻る
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={otp.length !== 6}
              style={{ flex: 2 }}
            >
              登録する
            </button>
          </div>
        </div>
      )}

      <p style={{ marginTop: '1.5rem' }}>
        すでにアカウントをお持ちの方は<Link to="/login">ログイン</Link>
      </p>
      <p>
        <Link to="/inquiry">お問い合わせ</Link>
      </p>
    </div>
  );
};
