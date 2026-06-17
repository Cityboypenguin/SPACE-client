import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommunityMembers, type Community } from '../../api/community';
import { CommunityAvatar } from '../../../../components/atoms/CommunityAvatar';
import { toUserMessage } from '../../../../lib/errorMessages';

const URL_SPLIT_REGEX = /(https?:\/\/[^\s　。、！？「」（）【】『』〔〕…‥・]+)/g;
const URL_TEST_REGEX = /^https?:\/\//;

const renderTextWithLinks = (text: string) =>
  text.split(URL_SPLIT_REGEX).map((part, i) =>
    URL_TEST_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#3b82f6', textDecoration: 'underline', wordBreak: 'break-all' }}
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      part
    ),
  );

type Props = {
  community: Community;
  onJoin?: (community: Community) => Promise<void>;
  joined?: boolean;
  onReport?: (community: Community) => Promise<void>;
  currentUserID: string | null;
};

export const CommunityBoard = ({ community, onJoin, joined = false, onReport}: Props) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [fetchedMemberCount, setFetchedMemberCount] = useState<number | null>(null);
  const [localJoinedCommunityID, setLocalJoinedCommunityID] = useState<string | null>(null);

  const locallyJoined = localJoinedCommunityID === community.ID;
  const joinedState = joined || community.isMember || locallyJoined;
  const memberCount = community.memberCount ?? fetchedMemberCount;
  const shownMemberCount = memberCount === null
    ? null
    : memberCount + (locallyJoined && !joined && !community.isMember ? 1 : 0);

  useEffect(() => {
    if (expanded && memberCount === null) {
      getCommunityMembers(community.ID)
        .then((members) => setFetchedMemberCount(members.length))
        .catch(() => console.error('メンバー数の取得に失敗しました'));
    }
  }, [expanded, community.ID, memberCount]);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onJoin) return;
    setJoining(true);
    setError('');
    try {
      await onJoin(community);
      setLocalJoinedCommunityID(community.ID);
    } catch (err) {
      setError(toUserMessage(err, 'コミュニティへの参加に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setJoining(false);
    }
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReport) {
      onReport(community);
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
        <CommunityAvatar 
          name={community.name} 
          src={community.avatarURL} 
          size={40} 
        />
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
        <span
          style={{
            display: 'inline-block',
            width: 0,
            height: 0,
            flexShrink: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            ...(expanded
              ? { borderBottom: '6px solid #94a3b8' }
              : { borderTop: '6px solid #94a3b8' }),
          }}
        />
      </div>

      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}
        >
          {shownMemberCount !== null && (
            <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>メンバー数:</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#646cff',
                  background: '#f0f2ff',
                  padding: '2px 8px',
                  borderRadius: 12,
                }}
              >
                {shownMemberCount} 人
              </span>
            </div>
          )}
          <p style={{ margin: '0 0 1rem', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {renderTextWithLinks(community.description)}
          </p>
          {error && <p style={{ color: 'red', margin: '0 0 0.5rem', fontSize: '0.85rem' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            
            {joinedState ? (
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
            ) : <div />}

            {onReport && (
              <button
                onClick={handleReportClick}
                style={{
                  padding: '0.4rem 0.9rem',
                  background: '#fff',
                  color: '#ef4444',
                  border: '1px solid #fca5a5',
                  borderRadius: '20px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                ⚠️ コミュニティ通報
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
