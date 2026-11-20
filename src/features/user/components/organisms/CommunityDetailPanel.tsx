import { useCallback, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { useNavigate } from 'react-router-dom';
import { CommunityAvatar } from '../../../../components/atoms/CommunityAvatar';
import { ScrollSentinel } from '../../../../components/atoms/ScrollSentinel';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../../components/atoms/UserNameLink';
import { RoleBadge } from '../atoms/RoleBadge';
import { useClickOutside } from '../../../../hooks/useClickOutside';
import { getCommunityMembers, type Community } from '../../api/community';
import { communityMemberPanelKey } from '../../cache/communityMembers';
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
  // メンバー一覧は SWR に任せる: 前回の一覧（共有キャッシュ）を即座に出しつつ、開いたとき・
  // タブに戻ったときに裏で取り直す。誰かの参加を受けたときは invalidateCommunityMembers()
  // がこのキーを名指しで取り直させる。読み込み済みのページはまとめて取り直す（revalidateAll）
  // ので、2ページ目以降だけ古いまま残ることはない。
  const {
    data: memberPages,
    error: membersError,
    isLoading: membersLoading,
    isValidating,
    size,
    setSize,
  } = useSWRInfinite(
    communityMemberPanelKey(community.ID),
    ([, cid, limit, offset]: readonly [string, string, number, number]) => getCommunityMembers(cid, limit, offset),
    { revalidateAll: true, revalidateFirstPage: false },
  );
  const members = memberPages?.flatMap((page) => page.items) ?? [];
  const memberTotal = memberPages?.[0]?.total ?? community.memberCount;
  const hasMoreMembers = members.length < memberTotal && (memberPages?.at(-1)?.items.length ?? 0) > 0;
  const membersLoadingMore = isValidating && !!memberPages && size > memberPages.length;

  const memberSentinelRef = useInfiniteScroll(
    useCallback(() => { void setSize((current) => current + 1); }, [setSize]),
    membersLoading || membersLoadingMore,
    !membersError && hasMoreMembers,
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
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => navigate(`/community/invite/${community.ID}/${community.roomID}`)}
            >
              招待する
            </button>
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
