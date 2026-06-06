import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { getCurrentTerms, consentToTerms, type TermsOfService } from '../api/terms';
import { TermsContent } from '../components/molecules/TermsContent';

export const UserRegisterPage = () => {
  const [accountID, setAccountID] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentTerms, setCurrentTerms] = useState<TermsOfService | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    getCurrentTerms()
      .then(setCurrentTerms)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (currentTerms && !agreed) return;
    setError('');
    try {
      await registerUser(accountID, name, email, password);
      const loginData = await loginUser(email, password);
      login(loginData.loginUser.token, loginData.loginUser.refreshToken, loginData.loginUser.user.ID);
      if (currentTerms) {
        await consentToTerms(currentTerms.ID);
      }
      navigate('/mypage');
    } catch {
      setError('登録に失敗しました。入力内容をご確認ください。');
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
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
        required
      />
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
      <button type="submit" disabled={!!currentTerms && !agreed}>登録する</button>
      <p>
        すでにアカウントをお持ちの方は<Link to="/login">ログイン</Link>
      </p>
      <p>
        <Link to="/inquiry">お問い合わせ</Link>
      </p>
    </form>
  );
};
