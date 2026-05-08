import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './UserHeader.module.css';

export const UserHeader = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <header className={styles.header}>
      <h2 className={styles.logo} onClick={() => navigate('/mypage')}>S-Universe</h2>
      <nav className={styles.nav}>
        <button className={styles.navButton} onClick={() => navigate('/mypage')}>ホーム</button>
        <button className={styles.navButton} onClick={() => navigate('/search')}>ユーザー検索</button>
        <button className={styles.navButton} onClick={() => navigate('/dm')}>DM</button>
        <button className={styles.navButton} onClick={() => navigate('/posts')}>投稿</button>
        <button className={styles.navButton} onClick={() => navigate('/community')}>コミュニティ</button>
      </nav>
      <button className={styles.logoutButton} onClick={() => void logout()}>ログアウト</button>
    </header>
  );
};
