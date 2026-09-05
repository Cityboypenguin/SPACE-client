import { useEffect, useState } from 'react';
import { getCommunityMembers, type Community, type CommunityMember } from '../../api/community';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../../components/atoms/UserNameLink';
import { storageUrl } from '../../../../lib/storage';
import styles from './CommunityMemberModal.module.css';

const RoleBadge = ({ role }: { role: string }) => {
  const isOwner = role === 'owner';
  return (
    <span className={`${styles.roleBadge} ${isOwner ? styles.roleBadgeOwner : styles.roleBadgeMember}`}>
      {isOwner ? 'オーナー' : 'メンバー'}
    </span>
  );
};

type Props = {
  community: Community;
  onClose: () => void;
};

export const CommunityMembersModal = ({ community, onClose }: Props) => {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void Promise.resolve().then(() => {
      getCommunityMembers(community.ID)
        .then((data) => setMembers(data))
        .catch(() => setError('メンバー一覧の取得に失敗しました'))
        .finally(() => setLoading(false));
    });
  }, [community.ID]);

  return (
    <div
      onClick={onClose}
      className={styles.overlay}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={styles.modal}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className={styles.title}>メンバー一覧 ({members.length})</h3>
          <button onClick={onClose} className={styles.closeButton} style={{ border: 'none' }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {loading && <p className={styles.loadingText}>読み込み中...</p>}
          {error && <p className={styles.errorText}>{error}</p>}

          {!loading && !error && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {members.map((m) => (
                <li
                  key={m.user.ID}
                  className={styles.memberItem}
                >
                  <UserAvatar
                    userId={m.user.ID}
                    name={m.user.name}
                    avatarUrl={m.user.avatarUrl ? storageUrl(m.user.avatarUrl) : undefined}
                    size={36}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <UserNameLink userId={m.user.ID}>
                      <div className={styles.memberName}>{m.user.name}</div>
                    </UserNameLink>
                    <div className={styles.memberAccountId}>@{m.user.accountID}</div>
                  </div>

                  <RoleBadge role={m.role} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
