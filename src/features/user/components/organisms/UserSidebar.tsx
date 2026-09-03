import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useUnreadRoomCounts } from '../../context/UnreadRoomCountsContext';
import { useProfile } from '../../hooks/useProfile';
import { Avatar } from '../../../../components/atoms/Avatar';
import { storageUrl } from '../../../../lib/storage';
import styles from './UserSidebar.module.css';

import appIcon from '../../../../assets/Senshu-Universe.svg';
import appLogo from '../../../../assets/Senshu-Universe_logo.svg';
import homeIcon from '../../../../assets/パーツ_ホーム.svg';
import dmIcon from '../../../../assets/パーツ_メール.svg';
import communityIcon from '../../../../assets/パーツ_コミュニティマーク.svg';
import timetableIcon from '../../../../assets/パーツ_時間割.svg';
import notificationIcon from '../../../../assets/パーツ_通知.svg';
import searchIcon from '../../../../assets/パーツ_検索.svg';
import settingsIcon from '../../../../assets/パーツ_設定.svg';

const NAV_ITEMS = [
  { icon: homeIcon, label: 'ホーム', path: '/home', iconSize: 30, mobile: 'primary' },
  { icon: dmIcon, label: 'DM', path: '/dm', iconSize: 32, mobile: 'primary' },
  { icon: communityIcon, label: 'コミュニティ', path: '/community', iconSize: 32, mobile: 'primary' },
  { icon: timetableIcon, label: '授業', path: '/timetable', iconSize: 28, mobile: 'primary' },
  { icon: notificationIcon, label: '通知', path: '/notifications', iconSize: 24, mobile: 'primary' },
  { icon: searchIcon, label: '検索', path: '/search', iconSize: 24, mobile: 'more' },
  { icon: settingsIcon, label: '設定', path: '/mypage/settings', iconSize: 36, mobile: 'more' },
] as const;

const MORE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.mobile === 'more');

export const UserSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();
  const { unreadCount } = useNotification();
  const { dmUnreadCount, communityUnreadCount } = useUnreadRoomCounts();
  const { profile } = useProfile(userId);
  const [expanded, setExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('has-sidebar');
    return () => document.body.classList.remove('has-sidebar');
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (moreNavRef.current && !moreNavRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreOpen]);

  const handleNavigate = (path: string) => {
    setExpanded(false);
    setMoreOpen(false);
    navigate(path);
  };

  const isNavActive = (path: string) => (
    location.pathname === path || location.pathname.startsWith(path + '/')
  );

  const renderIcon = (icon: string, label: string, iconSize: number) => (
    label === '設定' ? (
      <img src={icon} alt={label} className={`${styles.icon} ${styles.settingsNavIcon} themed-icon`} style={{ width: iconSize, height: iconSize }} />
    ) : (
      <img src={icon} alt={label} className={`${styles.icon} themed-icon`} style={{ width: iconSize, height: iconSize }} />
    )
  );

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
        {NAV_ITEMS.map(({ icon, label, path, iconSize, mobile }) => {
          const isActive = isNavActive(path);
          const badgeCount =
            label === '通知' ? unreadCount :
            label === 'DM' ? dmUnreadCount :
            label === 'コミュニティ' ? communityUnreadCount : 0;
          return (
            <button
              key={path}
              className={`${styles.navItem} ${mobile === 'more' ? styles.mobileHidden : ''} ${isActive ? styles.active : ''}`}
              onClick={() => handleNavigate(path)}
            >
              <span className={styles.iconWrap}>
                {renderIcon(icon, label, iconSize)}
                {badgeCount > 0 && (
                  <span className={styles.badge}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </span>
              <span className={styles.label}>{label}</span>
            </button>
          );
        })}
        <div className={styles.moreNavItem} ref={moreNavRef}>
          <button
            type="button"
            className={`${styles.navItem} ${styles.moreButton} ${MORE_NAV_ITEMS.some((item) => isNavActive(item.path)) ? styles.active : ''}`}
            onClick={() => setMoreOpen((prev) => !prev)}
            aria-label="その他"
            aria-expanded={moreOpen}
          >
            <span className={styles.iconWrap}>
              <span className={styles.moreDots} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </span>
            <span className={styles.label}>その他</span>
          </button>
          {moreOpen && (
            <div className={styles.moreMenu}>
              {MORE_NAV_ITEMS.map(({ icon, label, path, iconSize }) => (
                <button
                  key={path}
                  type="button"
                  className={`${styles.moreMenuItem} ${isNavActive(path) ? styles.moreMenuItemActive : ''}`}
                  onClick={() => handleNavigate(path)}
                >
                  <span className={styles.iconWrap}>
                    {renderIcon(icon, label, iconSize)}
                  </span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
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
