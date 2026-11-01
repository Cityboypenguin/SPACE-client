import { Link, useLocation } from 'react-router-dom';
import styles from './CourseChatAdminTabs.module.css';

const TABS = [
  { label: 'チャット一覧', path: '/admin/course-chats' },
  { label: '画像管理', path: '/admin/course-chat-images' },
  { label: 'NGワード管理', path: '/admin/ng-words' },
];

// 授業内チャット管理の中で切り替える3つのタブ（画像管理・NGワード管理もここから開く）
export const CourseChatAdminTabs = () => {
  const { pathname } = useLocation();

  return (
    <nav className={styles.tabs} aria-label="授業内チャット管理">
      {TABS.map((tab) => {
        const active = pathname === tab.path || pathname.startsWith(`${tab.path}/`);
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`${styles.tab} ${active ? styles.active : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
