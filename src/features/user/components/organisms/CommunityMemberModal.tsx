import { useEffect, useState } from 'react';
import { getCommunityMembers, type Community } from '../../api/community';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../../components/atoms/UserNameLink';
import { storageUrl } from '../../../../lib/storage';

const RoleBadge = ({ role }: { role: string }) => {
  const isOwner = role === 'owner';
  return (
    <span
      style={{
        fontSize: '0.75rem',
        padding: '2px 8px',
        borderRadius: '12px',
        background: isOwner ? '#fef3c7' : '#f1f5f9',
        color: isOwner ? '#d97706' : '#475569',
        fontWeight: 600,
      }}
    >
      {isOwner ? 'オーナー' : 'メンバー'}
    </span>
  );
};

type Props = {
  community: Community;
  onClose: () => void;
};

export const CommunityMembersModal = ({ community, onClose }: Props) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCommunityMembers(community.ID)
      .then((data) => setMembers(data))
      .catch(() => setError('メンバー一覧の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [community.ID]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', padding: '1.5rem', borderRadius: '12px',
          width: '90%', maxWidth: '450px', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>メンバー一覧 ({members.length})</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {loading && <p style={{ color: '#64748b', textAlign: 'center' }}>読み込み中...</p>}
          {error && <p style={{ color: '#ef4444' }}>{error}</p>}
          
          {!loading && !error && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {members.map((m) => (
                <li
                  key={m.user.ID}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0',
                  }}
                >
                  <UserAvatar 
                    userId={m.user.ID} 
                    name={m.user.name} 
                    avatarUrl={m.user.avatarUrl ? storageUrl(m.user.avatarUrl) : undefined}
                    size={36} 
                  />
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <UserNameLink userId={m.user.ID}>
                      <div style={{ fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user.name}</div>
                    </UserNameLink>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{m.user.accountID}</div>
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