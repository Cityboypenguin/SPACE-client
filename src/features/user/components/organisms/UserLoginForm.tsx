import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { toUserMessage } from '../../../../lib/errorMessages';
import logo from '../../../../assets/Senshu-Universe_logo.svg';
import styles from './UserLoginForm.module.css';

export const UserLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await loginUser(email, password);
      login(data.loginUser.token, data.loginUser.refreshToken, data.loginUser.user.ID);
      navigate('/home');
    } catch (err) {
      setError(toUserMessage(err, 'メールアドレスまたはパスワードが正しくありません'));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <img src={logo} alt="Senshu Universe" className={styles.logo} />
      </div>
      <div className={styles.right}>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            className={styles.input}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className={styles.input}
            required
          />
          <button type="submit" className={styles.btnPrimary}>
            ログイン
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => navigate('/register')}
          >
            新規登録
          </button>
          <Link to="/inquiry" className={styles.link}>パスワードを忘れた場合</Link>
          <Link to="/inquiry" className={styles.link}>お問い合わせはこちら</Link>
        </form>
      </div>
    </div>
  );
};
