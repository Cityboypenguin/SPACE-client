import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../../../components/atoms/Avatar';
import { type Community } from '../../api/community';

type Props = {
  community: Community;
  onJoin?: (community: Community) => Promise<void>;
  joined?: boolean;
};

export const CommunityBoard = ({ community, onJoin, joined = false }: Props) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onJoin) return;
    setJoining(true);
    setError('');
    try {
      await onJoin(community);
    } catch (err) {
      setError(err instanceof Error ? err.message : '参加に失敗しました');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '1rem 1.25rem',
        cursor: 'pointer',
        background: expanded ? '#f8faff' : '#fff',
        transition: 'box-shadow 0.15s',
        boxShadow: expanded ? '0 2px 12px rgba(100,108,255,0.10)' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Avatar name={community.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b' }}>{community.name}</div>
          {!expanded && (
            <div
              style={{
                fontSize: '0.82rem',
                color: '#64748b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {community.description}
            </div>
          )}
        </div>
        <span style={{ color: '#94a3b8', fontSize: '0.8rem', flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}
        >
          <p style={{ margin: '0 0 1rem', color: '#475569', lineHeight: 1.6 }}>
            {community.description}
          </p>
          {error && <p style={{ color: 'red', margin: '0 0 0.5rem', fontSize: '0.85rem' }}>{error}</p>}
          {joined ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.35rem 0.9rem',
                  borderRadius: '20px',
                  background: '#dcfce7',
                  color: '#16a34a',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                参加済み
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/community/chat/${community.roomID}`, { state: { communityID: community.ID } });
                }}
                style={{
                  padding: '0.45rem 1.2rem',
                  borderRadius: '20px',
                  background: '#646cff',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                チャットルームへ
              </button>
            </div>
          ) : onJoin ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              style={{
                padding: '0.45rem 1.2rem',
                borderRadius: '20px',
                background: joining ? '#94a3b8' : '#646cff',
                color: '#fff',
                border: 'none',
                cursor: joining ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              {joining ? '参加中...' : 'コミュニティに参加'}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};
