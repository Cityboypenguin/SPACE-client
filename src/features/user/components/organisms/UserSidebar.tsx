import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useProfile } from '../../hooks/useProfile';
import { Avatar } from '../../../../components/atoms/Avatar';
import { storageUrl } from '../../../../lib/storage';
import styles from './UserSidebar.module.css';

import appIcon from '../../../../assets/Senshu-Universe.svg';
import appLogo from '../../../../assets/Senshu-Universe_logo.svg';
import homeIcon from '../../../../assets/パーツ_ホーム.svg';
import dmIcon from '../../../../assets/パーツ_メール.svg';
import communityIcon from '../../../../assets/パーツ_コミュニティマーク.svg';
import notificationIcon from '../../../../assets/パーツ_通知.svg';
import settingsIcon from '../../../../assets/パーツ_設定.svg';
import searchIcon from '../../../../assets/パーツ_検索.svg';

const NAV_ITEMS = [
  { icon: homeIcon, label: 'ホーム', path: '/home', iconSize: 30 },
  { icon: dmIcon, label: 'DM', path: '/dm', iconSize: 32 },
  { icon: communityIcon, label: 'コミュニティ', path: '/community', iconSize: 32 },
  { icon: notificationIcon, label: '通知', path: '/notifications', iconSize: 24 },
  { icon: searchIcon, label: '検索', path: '/search', iconSize: 24 },
  { icon: settingsIcon, label: '設定', path: '/mypage/settings', iconSize: 40 },
] as const;

export const UserSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();
  const { unreadCount } = useNotification();
  const { profile } = useProfile(userId);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    document.body.classList.add('has-sidebar');
    return () => document.body.classList.remove('has-sidebar');
  }, []);

  const handleNavigate = (path: string) => {
    setExpanded(false);
    navigate(path);
  };

  return (
    <aside
      className={`${styles.sidebar} ${expanded ? styles.expanded : ''}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className={styles.logo} onClick={() => handleNavigate('/home')}>
        <span className={styles.logoIconWrap}>
          <img src={appIcon} alt="Senshu-Universe" className={styles.logoMark} />
        </span>
        <img src={appLogo} alt="Senshu-Universe" className={styles.logoText} />
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ icon, label, path, iconSize }) => {
          const isActive =
            location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <button
              key={path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => handleNavigate(path)}
            >
              <span className={styles.iconWrap}>
                <img src={icon} alt={label} className={styles.icon} style={{ width: iconSize, height: iconSize }} />
                {label === '通知' && unreadCount > 0 && (
                  <span className={styles.badge}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
              <span className={styles.label}>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.bottom}>
        <button className={styles.userItem} onClick={() => handleNavigate('/mypage')}>
          <span className={styles.iconWrap}>
            {profile ? (
              profile.avatarUrl ? (
                <img
                  src={storageUrl(profile.avatarUrl) ?? undefined}
                  alt={profile.user.name}
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <Avatar name={profile.user.name} size={32} />
              )
            ) : (
              <span className={styles.avatarPlaceholder} />
            )}
          </span>
          <span className={styles.label}>
            {profile ? profile.user.name : 'ユーザー'}
          </span>
        </button>
      </div>
    </aside>
  );
};
