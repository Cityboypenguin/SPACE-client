import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommunityAvatar } from '../../../../components/atoms/CommunityAvatar';
import { ScrollSentinel } from '../../../../components/atoms/ScrollSentinel';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../../components/atoms/UserNameLink';
import { RoleBadge } from '../atoms/RoleBadge';
import { useClickOutside } from '../../../../hooks/useClickOutside';
import { getCommunityMembers, type Community, type CommunityMember } from '../../api/community';
import { getCommunityMemberListCache, saveCommunityMemberListCache } from '../../cache/communityMembers';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { storageUrl } from '../../../../lib/storage';
import personIcon from '../../../../assets/パーツ_人間.svg';
import redLeaveIcon from '../../../../assets/パーツ_退出（赤）.svg';
import reportIcon from '../../../../assets/パーツ_通報.svg';
import styles from './CommunityDetailPanel.module.css';
import { renderTextWithLinks } from '../../../../lib/renderTextWithLinks';

type Props = {
  community: Community;
  isOwner: boolean;
  leaveError?: string;
  onClose: () => void;
  onLeave: () => void;
  onReport: () => void;
};

export const CommunityDetailPanel = ({ community, isOwner, leaveError, onClose, onLeave, onReport }: Props) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuWrapRef = useClickOutside<HTMLDivElement>(showMenu, () => setShowMenu(false));
  const memberPageSize = 10;
  const [initialCache] = useState(() => getCommunityMemberListCache(community.ID));
  const [members, setMembers] = useState<CommunityMember[]>(initialCache?.members ?? []);
  const [memberTotal, setMemberTotal] = useState(initialCache?.total ?? community.memberCount);
  const [membersLoading, setMembersLoading] = useState(!initialCache);
  const [membersLoadingMore, setMembersLoadingMore] = useState(false);
  const [membersError, setMembersError] = useState(false);
  const membersRef = useRef(members);
  const memberTotalRef = useRef(memberTotal);
  const membersLoadingRef = useRef(false);

  const loadMembers = useCallback(async (offset: number, isInitial: boolean) => {
    if (membersLoadingRef.current) return;
    membersLoadingRef.current = true;
    if (isInitial) setMembersLoading(true);
    else setMembersLoadingMore(true);
    try {
      const page = await getCommunityMembers(community.ID, memberPageSize, offset);
      setMembers((current) => {
        const next = isInitial ? page.items : [...current, ...page.items];
        membersRef.current = next;
        saveCommunityMemberListCache(community.ID, { members: next, total: page.total });
        return next;
      });
      memberTotalRef.current = page.total;
      setMemberTotal(page.total);
      setMembersError(false);
    } catch {
      setMembersError(true);
    } finally {
      membersLoadingRef.current = false;
      if (isInitial) setMembersLoading(false);
      else setMembersLoadingMore(false);
    }
  }, [community.ID]);

  useEffect(() => {
    if (initialCache) return;
    void Promise.resolve().then(() => loadMembers(0, true));
  }, [initialCache, loadMembers]);

  const memberSentinelRef = useInfiniteScroll(
    useCallback(() => {
      if (!membersLoadingRef.current && membersRef.current.length < memberTotalRef.current) {
        void loadMembers(membersRef.current.length, false);
      }
    }, [loadMembers]),
    membersLoading || membersLoadingMore,
    !membersError && members.length < memberTotal,
  );

  const returnPath = `/community/chat/${community.roomID}`;

  return (
    <div className={styles.backdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.panel}>
        {/* 左：コミュニティ情報 */}
        <div className={styles.infoPane}>
          <div className={styles.infoPaneHeader}>
            <div className={styles.menuWrap} ref={menuWrapRef}>
              <button className={styles.menuBtn} onClick={() => setShowMenu((v) => !v)}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </button>
              {showMenu && (
                <div className={styles.menuDropdown}>
                  <button 
                    className={styles.menuItem} 
                    onClick={() => { setShowMenu(false); onReport();}}
                  >
                  <img src={reportIcon} alt="" className={`${styles.dropdownIcon} themed-icon`} />
                  通報
                  </button>
                  <button
                    className={`${styles.menuItem} ${styles.menuItemDanger}`} 
                    onClick={() => { setShowMenu(false); onLeave(); }}
                  >
                  <img src={redLeaveIcon} alt="" className={styles.dropdownIcon} />
                  退出
                  </button>
                </div>
              )}
            </div>
            {isOwner && (
              <button
                className={styles.editBtn}
                onClick={() => navigate(`/community/edit/${community.ID}`, { state: { community, returnPath } })}
              >
                編集
              </button>
            )}
            <button className={styles.mobileCloseBtn} onClick={onClose}>✕</button>
          </div>

          <div className={styles.avatarWrap}>
            <CommunityAvatar name={community.name} src={community.avatarURL} size={120} />
          </div>
          <p className={styles.communityName}>{community.name}</p>
          <p className={styles.memberCount}>
            <img src={personIcon} alt="メンバー数" className={styles.memberIcon} />
            {memberTotal}
          </p>
          {leaveError && <p className={styles.leaveError}>{leaveError}</p>}
          <p className={styles.descLabel}>紹介文</p>
          <p>{renderTextWithLinks({ text: community.description, linkClassName: styles.descriptionLink })}</p>
        </div>

        {/* 右：メンバー一覧 */}
        <div className={styles.membersPane}>
          <div className={styles.membersPaneHeader}>
            <span className={styles.membersPaneTitle}>メンバー一覧</span>
            {isOwner && (
              <button
                className={styles.editBtn}
                onClick={() => navigate(`/community/members/${community.ID}`, { state: { community, returnPath } })}
              >
                編集
              </button>
            )}
            <button className={styles.pcCloseBtn} onClick={onClose}>✕</button>
          </div>
          <div className={styles.memberListScroll}>
            {membersLoading ? (
              <p className={styles.memberStatus}>読み込み中...</p>
            ) : membersError && members.length === 0 ? (
              <p className={`${styles.memberStatus} ${styles.memberError}`}>メンバー一覧の取得に失敗しました</p>
            ) : (
              <ul className={styles.memberList}>
                {members.map((m) => (
                  <li key={m.user.ID} className={styles.memberItem}>
                    <UserAvatar
                      userId={m.user.ID}
                      name={m.user.name}
                      avatarUrl={m.user.avatarUrl ? storageUrl(m.user.avatarUrl) ?? undefined : undefined}
                      size={32}
                    />
                    <UserNameLink userId={m.user.ID} className={styles.memberName}>{m.user.name}</UserNameLink>
                    <RoleBadge role={m.role} />
                  </li>
                ))}
              </ul>
            )}
            <ScrollSentinel ref={memberSentinelRef} />
            {membersLoadingMore && (
              <p className={styles.loadingMoreMembers}>読み込み中...</p>
            )}
            {membersError && members.length > 0 && (
              <p className={`${styles.loadingMoreMembers} ${styles.memberError}`}>追加のメンバーを取得できませんでした</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
