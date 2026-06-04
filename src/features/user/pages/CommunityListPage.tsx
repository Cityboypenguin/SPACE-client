import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { CommunityAvatar } from '../../../components/atoms/CommunityAvatar';
import { listMyCommunities, type Community } from '../api/community';
import { useUnreadSubscription } from '../hooks/useUnreadSubscription';
import { UnreadCountBadge } from '../../../components/atoms/UnreadCountBadge';
import styles from './CommunityListPage.module.css';

export const CommunityListPage = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    listMyCommunities()
      .then((data) => { if (active) setCommunities(data); })
      .catch(() => { if (active) setError('コミュニティの読み込みに失敗しました'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useUnreadSubscription(({ roomID, unreadCount }) => {
    setCommunities((prev) => prev.map((c) =>
      c.roomID === roomID ? { ...c, unreadCount } : c
    ));
  });

  return (
    <div>
      <UserHeader />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>コミュニティ</h1>
          <div className={styles.headerActions}>
            <button className={styles.btnSecondary} onClick={() => navigate('/community/browse')}>
              コミュニティを探す
            </button>
            <button className={styles.btnPrimary} onClick={() => navigate('/community/create')}>
              + 作成
            </button>
          </div>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {loading ? (
          <p style={{ color: '#94a3b8' }}>読み込み中...</p>
        ) : communities.length === 0 ? (
          <div className={styles.empty}>
            <p>参加しているコミュニティがありません</p>
            <button className={styles.btnPrimaryRound} onClick={() => navigate('/community/browse')}>
              コミュニティを探す
            </button>
          </div>
        ) : (
          <ul className={styles.list}>
            {communities.map((c) => {
              const hasUnread = (c.unreadCount ?? 0) > 0;
              return (
                <li
                  key={c.ID}
                  onClick={() => navigate(`/community/chat/${c.roomID}`, { state: { communityID: c.ID } })}
                  className={`${styles.item} ${hasUnread ? styles.itemUnread : ''}`}
                >
                  <CommunityAvatar name={c.name} src={c.avatarURL} />
                  <div className={styles.itemBody}>
                    <div className={`${styles.itemName} ${hasUnread ? styles.itemNameUnread : ''}`}>{c.name}</div>
                    <div className={styles.itemDescription}>{c.description}</div>
                  </div>
                  {hasUnread ? (
                    <UnreadCountBadge count={c.unreadCount} />
                  ) : (
                    <span className={styles.chevron}>›</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};
