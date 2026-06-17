import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser, sendEmailOTP, verifyEmailOTP, USER_TOKEN_KEY } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { getCurrentTerms, consentToTerms, type TermsOfService } from '../api/terms';
import { toUserMessage } from '../../../lib/errorMessages';
import { TermsContent } from '../components/molecules/TermsContent';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { OtpInputSection } from '../components/molecules/OtpInputSection';
import styles from './UserRegisterPage.module.css';

const OTP_COOLDOWN_SECONDS = 60;

const studentEmailRe = /^(EE|EL|EW|JL|JP|MA|MD|CM|CA|LB|LA|LT|LR|LK|LM|NE|HP|HS|GN|GC|E)(2[0-9]|[3-9][0-9])\d{4}@senshu-u\.jp$/i;

const validateEmail = (value: string): string => {
  if (value && !studentEmailRe.test(value)) {
    return 'メールアドレスは2020年度以降の学籍番号形式のみ登録できます';
  }
  return '';
};

const validatePassword = (value: string): string => {
  if (value && value.length < 8) return 'パスワードは8文字以上で入力してください';
  return '';
};

type Step = 1 | 2 | 3 | 4;

const StepIndicator = ({ current }: { current: Step }) => {
  const steps: Step[] = [1, 2, 3, 4];
  return (
    <div className={styles.stepBar}>
      {steps.map((s, i) => (
        <div key={s} className={styles.stepItem}>
          {i > 0 && (
            <div className={`${styles.stepLine}${current > s ? ` ${styles.stepLineDone}` : ''}`} />
          )}
          <div
            className={`${styles.stepCircle}${
              current === s
                ? ` ${styles.stepCircleActive}`
                : current > s
                ? ` ${styles.stepCircleDone}`
                : ''
            }`}
          >
            {current > s ? '✓' : s}
          </div>
        </div>
      ))}
    </div>
  );
};

export const UserRegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>(1);

  // Terms (step 1)
  const [currentTerms, setCurrentTerms] = useState<TermsOfService | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [termsError, setTermsError] = useState(false);

  // Email (step 2)
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpSendError, setOtpSendError] = useState('');
  const otpCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // OTP (step 3)
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Account info (step 4)
  const [name, setName] = useState('');
  const [accountID, setAccountID] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [step4Errors, setStep4Errors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCurrentTerms()
      .then(setCurrentTerms)
      .catch(() => {});
  }, []);

  useEffect(
    () => () => {
      if (otpCooldownRef.current) clearInterval(otpCooldownRef.current);
    },
    [],
  );

  const startOtpCooldown = () => {
    if (otpCooldownRef.current) clearInterval(otpCooldownRef.current);
    setOtpCooldown(OTP_COOLDOWN_SECONDS);
    otpCooldownRef.current = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(otpCooldownRef.current!);
          otpCooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step handlers ──

  const handleStep1Next = () => {
    if (currentTerms && !agreed) return;
    setStep(2);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(validateEmail(value));
    if (otpSent) {
      setOtpSent(false);
      setOtpSendError('');
    }
  };

  const handleSendOTP = async () => {
    const err = validateEmail(email);
    if (err || !email) {
      setEmailError(err || 'メールアドレスを入力してください');
      return;
    }
    setSendingOtp(true);
    setOtpSendError('');
    try {
      await sendEmailOTP(email);
      setOtpSent(true);
      startOtpCooldown();
      setStep(3);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('1分後に再送信')) {
        setOtpSendError('認証コードは1分後に再送信できます。');
        startOtpCooldown();
      } else {
        setOtpSendError('認証コードの送信に失敗しました。メールアドレスをご確認ください。');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleStep3Next = async () => {
    if (otp.length !== 6) {
      setOtpError('6桁の認証コードを入力してください');
      return;
    }
    setVerifyingOtp(true);
    setOtpError('');
    try {
      await verifyEmailOTP(email, otp);
      setStep(4);
    } catch (err) {
      setOtpError(toUserMessage(err, '認証コードが正しくありません。'));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async () => {
    const errors: string[] = [];
    if (!name) errors.push('ユーザー名を入力してください');
    if (!accountID) errors.push('ユーザーIDを入力してください');
    if (!password) errors.push('パスワードを入力してください');
    else if (passwordError) errors.push(passwordError);
    if (errors.length > 0) {
      setStep4Errors(errors);
      return;
    }
    setStep4Errors([]);
    setSubmitting(true);
    setSubmitError('');

    try {
      await registerUser(accountID, name, email, password, otp);
    } catch {
      setSubmitError('ユーザーIDまたはメールアドレスが既に使用されています。変更して再度お試しください。');
      setSubmitting(false);
      return;
    }

    try {
      const loginData = await loginUser(email, password);
      // consentToTerms を login() より前に実行する。
      // login() がトークンを React state にセットすると NotificationContext が即座に
      // getMyTermsConsentStatus() を呼ぶため、先に同意を完了させておかないと
      // 「未同意」としてモーダルが表示されてしまう。
      localStorage.setItem(USER_TOKEN_KEY, loginData.loginUser.token);
      if (currentTerms) await consentToTerms(currentTerms.ID);
      login(loginData.loginUser.token, loginData.loginUser.refreshToken, loginData.loginUser.user.ID);
      navigate('/mypage');
    } catch {
      setSubmitError('登録は完了しましたが、自動ログインに失敗しました。ログインページからログインしてください。');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 1) {
      navigate('/login');
    } else {
      setStep((prev) => (prev - 1) as Step);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={goBack} type="button">
          <ChevronLeft />
        </button>
        <h1 className={styles.pageTitle}>新規会員登録</h1>
      </div>

      <StepIndicator current={step} />

      <div className={styles.card}>
        {/* ── Step 1: 利用規約同意 ── */}
        {step === 1 && (
          <div>
            {currentTerms ? (
              <>
                <TermsContent
                  documentUrl={currentTerms.documentUrl}
                  onScrolledToBottom={() => setScrolled(true)}
                  onError={() => setTermsError(true)}
                  style={{
                    height: '240px',
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '1rem',
                    lineHeight: 1.8,
                    fontSize: '0.85rem',
                    color: '#334155',
                    marginBottom: '0.5rem',
                  }}
                />
                {!scrolled && !termsError && (
                  <p className={styles.termsScrollHint}>
                    最後までスクロールして利用規約を確認してください
                  </p>
                )}
                <label className={styles.termsCheckLabel}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    disabled={!scrolled && !termsError}
                  />
                  利用規約に同意する
                </label>
              </>
            ) : (
              <p style={{ color: '#94a3b8', textAlign: 'center' }}>読み込み中...</p>
            )}
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleStep1Next}
              disabled={currentTerms !== null && !agreed}
            >
              同意して次へ
            </button>
          </div>
        )}

        {/* ── Step 2: メアド入力 ── */}
        {step === 2 && (
          <div>
            <label className={styles.fieldLabel}>専修大学メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="学籍番号@senshu-u.jp"
              className={styles.input}
            />
            {emailError && <p className={styles.fieldError}>{emailError}</p>}
            {otpSendError && <p className={styles.fieldError}>{otpSendError}</p>}
            {otpSent && (
              <p className={`${styles.hint} ${styles.hintSuccess}`}>
                認証コードを送信しました。メールをご確認ください。
              </p>
            )}
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleSendOTP}
              disabled={sendingOtp || !!emailError || !email || otpCooldown > 0}
            >
              {sendingOtp
                ? '送信中...'
                : otpCooldown > 0
                ? `${otpCooldown}秒後に再送信可能`
                : otpSent
                ? '再送信'
                : '認証コード'}
            </button>
          </div>
        )}

        {/* ── Step 3: 認証コード入力 ── */}
        {step === 3 && (
          <div>
            <OtpInputSection
              email={email}
              otp={otp}
              onOtpChange={(value) => { setOtp(value); setOtpError(''); }}
              otpError={otpError}
              onResend={handleSendOTP}
              resending={sendingOtp}
              cooldown={otpCooldown}
              sendError={otpSendError}
            />
            <div className={styles.actionRow}>
              <button type="button" className={styles.btnOutline} onClick={() => setStep(2)}>
                <ChevronLeft /> 戻る
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                style={{ marginTop: 0, flex: 1 }}
                onClick={handleStep3Next}
                disabled={verifyingOtp || otp.length !== 6}
              >
                {verifyingOtp ? '確認中...' : '次へ'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: アカウント情報 ── */}
        {step === 4 && (
          <div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>ユーザー名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="表示名"
                className={styles.input}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>ユーザーID</label>
              <input
                type="text"
                value={accountID}
                onChange={(e) => setAccountID(e.target.value)}
                placeholder="半角英数字"
                className={styles.input}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(validatePassword(e.target.value));
                }}
                placeholder="8文字以上"
                className={styles.input}
              />
              {passwordError && <p className={styles.fieldError}>{passwordError}</p>}
            </div>
            {step4Errors.length > 0 && (
              <ul className={styles.errorList}>
                {step4Errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            {submitError && <p className={styles.submitError}>{submitError}</p>}
            <div className={styles.actionRow}>
              <button type="button" className={styles.btnOutline} onClick={() => setStep(3)}>
                <ChevronLeft /> 戻る
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                style={{ marginTop: 0, flex: 1 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '登録中...' : '登録する'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
