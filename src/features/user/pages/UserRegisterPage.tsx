import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser, USER_TOKEN_KEY } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { getCurrentTerms, consentToTerms, type TermsOfService } from '../api/terms';
import { TermsContent } from '../components/molecules/TermsContent';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import styles from './UserRegisterPage.module.css';

const REGISTER_PROGRESS_KEY = 'space_register_progress';

interface RegisterProgress {
  step: Step;
  agreedTermsId: string | null;
  scrolled: boolean;
  agreed: boolean;
  email: string;
  name: string;
  accountID: string;
}

const loadRegisterProgress = (): Partial<RegisterProgress> => {
  try {
    const raw = sessionStorage.getItem(REGISTER_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveRegisterProgress = (progress: RegisterProgress) => {
  try {
    sessionStorage.setItem(REGISTER_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // private mode 等でstorageが使えない場合は無視
  }
};

const clearRegisterProgress = () => {
  try {
    sessionStorage.removeItem(REGISTER_PROGRESS_KEY);
  } catch {
    // ignore
  }
};

type Step = 1 | 2;

const normalizeStep = (value: unknown): Step => (value === 2 ? 2 : 1);

const StepIndicator = ({ current }: { current: Step }) => {
  const steps: Step[] = [1, 2];
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

  // リロード対策: 直前の進行状況を一度だけ読み込む（パスワードは保存しない）
  const [initialProgress] = useState(() => loadRegisterProgress());

  const [step, setStep] = useState<Step>(normalizeStep(initialProgress.step));

  // Terms (step 1)
  const [currentTerms, setCurrentTerms] = useState<TermsOfService | null>(null);
  const [scrolled, setScrolled] = useState(initialProgress.scrolled ?? false);
  const [agreed, setAgreed] = useState(initialProgress.agreed ?? false);
  const [termsError, setTermsError] = useState(false);

  // Account info (step 2)
  const [email, setEmail] = useState(initialProgress.email ?? '');
  const [name, setName] = useState(initialProgress.name ?? '');
  const [accountID, setAccountID] = useState(initialProgress.accountID ?? '');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCurrentTerms()
      .then((terms) => {
        setCurrentTerms(terms);
        // 保存されていた同意は、表示中の規約と一致する場合のみ有効とする
        if (initialProgress.agreedTermsId && terms && initialProgress.agreedTermsId !== terms.ID) {
          setAgreed(false);
          setScrolled(false);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 進行状況をリロードに備えて保存する（パスワードは含めない）
  useEffect(() => {
    saveRegisterProgress({
      step,
      agreedTermsId: agreed ? currentTerms?.ID ?? null : null,
      scrolled,
      agreed,
      email,
      name,
      accountID,
    });
  }, [step, agreed, scrolled, email, name, accountID, currentTerms]);

  const handleStep1Next = () => {
    if (currentTerms && !agreed) return;
    setStep(2);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedAccountID = accountID.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedAccountID || !trimmedEmail || !password) {
      setSubmitError('すべてのフィールドを入力してください。');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      await registerUser(trimmedAccountID, trimmedName, trimmedEmail, password);
      clearRegisterProgress();
      const loginData = await loginUser(trimmedEmail, password);
      localStorage.setItem(USER_TOKEN_KEY, loginData.loginUser.token);
      if (currentTerms) await consentToTerms(currentTerms.ID);
      login(loginData.loginUser.token, loginData.loginUser.refreshToken, loginData.loginUser.user.ID);
      navigate('/mypage');
    } catch (err) {
      if (err instanceof Error && err.message.includes('email is already taken')) {
        setSubmitError('メールアドレスが既に使用されています。変更して再度お試しください。');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 1) {
      clearRegisterProgress();
      navigate('/login');
    } else {
      setStep((prev) => (prev - 1) as Step);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button onClick={goBack} type="button">
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

        {step === 2 && (
          <div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>ユーザー名</label>
              <input
                type="text"
                required
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
                required
                value={accountID}
                onChange={(e) => setAccountID(e.target.value)}
                placeholder="半角英数字"
                className={styles.input}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>メールアドレス</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
                className={styles.input}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>パスワード</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                className={styles.input}
              />
            </div>
            {submitError && <p className={styles.submitError}>{submitError}</p>}
            <div className={styles.actionRow}>
              <button type="button" onClick={() => setStep(1)}>
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
