import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommunityAvatar } from '../../../../components/atoms/CommunityAvatar';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { RoleBadge } from '../atoms/RoleBadge';
import { getCommunityMembers, type Community, type CommunityMember } from '../../api/community';
import { storageUrl } from '../../../../lib/storage';
import personIcon from '../../../../assets/パーツ_人間.svg';
import styles from './CommunityDetailPanel.module.css';

const URL_SPLIT_REGEX = /(https?:\/\/[^\s　　、。！？「」（）【】『』〔〕…‥・]+)/g;
const URL_TEST_REGEX = /^https?:\/\//;

const renderTextWithLinks = (text: string) => {
  const parts = text.split(URL_SPLIT_REGEX);
  return parts.map((part, i) =>
    URL_TEST_REGEX.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={styles.descriptionLink}>
        {part}
      </a>
    ) : (
      part
    ),
  );
};

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
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCommunityMembers(community.ID)
      .then(setMembers)
      .catch(() => {});
  }, [community.ID]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

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
                  <button className={styles.menuItem} onClick={() => { setShowMenu(false); onReport(); }}>通報</button>
                  <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { setShowMenu(false); onLeave(); }}>退出</button>
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
          </div>

          <div className={styles.avatarWrap}>
            <CommunityAvatar name={community.name} src={community.avatarURL} size={120} />
          </div>
          <p className={styles.communityName}>{community.name}</p>
          <p className={styles.memberCount}>
            <img src={personIcon} alt="メンバー数" className={styles.memberIcon} />
            {members.length}
          </p>
          {leaveError && <p className={styles.leaveError}>{leaveError}</p>}
          <p className={styles.descLabel}>紹介文</p>
          <p className={styles.description}>{renderTextWithLinks(community.description)}</p>
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
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
          <ul className={styles.memberList}>
            {members.map((m) => (
              <li key={m.user.ID} className={styles.memberItem}>
                <UserAvatar
                  userId={m.user.ID}
                  name={m.user.name}
                  avatarUrl={m.user.avatarUrl ? storageUrl(m.user.avatarUrl) ?? undefined : undefined}
                  size={32}
                />
                <span className={styles.memberName}>{m.user.name}</span>
                <RoleBadge role={m.role} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
