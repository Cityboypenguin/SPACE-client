import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommunityMembers, type Community } from '../../api/community';
import { CommunityAvatar } from '../../../../components/atoms/CommunityAvatar';
import { toUserMessage } from '../../../../lib/errorMessages';
import { renderTextWithLinks } from '../../../../lib/renderTextWithLinks';
import styles from './CommunityBoard.module.css';

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
    >
      <div className={styles.headerRow}>
        <CommunityAvatar 
          name={community.name} 
          src={community.avatarURL} 
          size={40} 
        />
        <div className={styles.titleBlock}>
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
            <div className={styles.memberCountRow}>
              <span className={styles.memberCountLabel}>メンバー数:</span>
              <span className={styles.memberCountBadge}>
                {shownMemberCount} 人
              </span>
            </div>
          )}
          <p className={styles.description}>
            {renderTextWithLinks({
              text: community.description,
              linkClassName: styles.link,
              stopPropagation: true,
            })}
          </p>
          {error && <p className={styles.errorText}>{error}</p>}
          <div className={styles.actionsRow}>

            {joinedState ? (
              <div className={styles.joinedActions}>
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
