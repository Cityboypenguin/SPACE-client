import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommunityMembers, type Community } from '../../api/community';
import { CommunityAvatar } from '../../../../components/atoms/CommunityAvatar';
import { toUserMessage } from '../../../../lib/errorMessages';
import styles from './CommunityBoard.module.css';

const URL_SPLIT_REGEX = /(https?:\/\/[^\s\u3000。、！？「」（）【】『』〔〕…‥・]+)/g;
const URL_TEST_REGEX = /^https?:\/\//;

const renderTextWithLinks = (text: string) =>
  text.split(URL_SPLIT_REGEX).map((part, i) =>
    URL_TEST_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
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
      className={`${styles.card} ${expanded ? styles.cardExpanded : styles.cardCollapsed}`}
      style={{
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
          <div className={styles.title}>
            {community.name}
          </div>
          {!expanded && (
            <div className={styles.subtitle}>
              {community.description}
            </div>
          )}
        </div>
        <span className={`${styles.caret} ${expanded ? styles.caretUp : styles.caretDown}`} />
      </div>

      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={styles.expandedSection}
        >
          {shownMemberCount !== null && (
            <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className={styles.memberCountLabel}>メンバー数:</span>
              <span className={styles.memberCountBadge}>
                {shownMemberCount} 人
              </span>
            </div>
          )}
          <p className={styles.description}>
            {renderTextWithLinks(community.description)}
          </p>
          {error && <p className={styles.errorText}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>

            {joinedState ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={styles.joinedBadge}>
                  参加済み
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/community/chat/${community.roomID}`, { state: { communityID: community.ID, community } });
                  }}
                  className={styles.chatButton}
                >
                  チャットルームへ
                </button>
              </div>
            ) : onJoin ? (
              <button
                onClick={handleJoin}
                disabled={joining}
                className={`${styles.joinButton} ${joining ? styles.joinButtonDisabled : styles.joinButtonActive}`}
              >
                {joining ? '参加中...' : 'コミュニティに参加'}
              </button>
            ) : <div />}

            {onReport && (
              <button
                onClick={handleReportClick}
                className={styles.reportButton}
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
