import { useState } from 'react';
import useSWR from 'swr';
import { getCommunityMembers, type Community } from '../../api/community';
import { staticCacheOptions } from '../../cache/swrOptions';
import { communityMembersKey } from '../../cache/communityMembers';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../../components/atoms/UserNameLink';
import { Modal, ModalCloseButton } from '../../../../components/molecules/Modal';
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
  const pageSize = 50;
  const [offset, setOffset] = useState(0);
  // 詳細パネル・設定モーダルと同じキャッシュを共有する。開き直しても取り直さない。
  const { data, isLoading: loading, error } = useSWR(
    communityMembersKey(community.ID, pageSize, offset),
    ([, cid, limit, pageOffset]: [string, string, number, number]) => getCommunityMembers(cid, limit, pageOffset),
    staticCacheOptions,
  );
  const members = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <Modal onClose={onClose} overlayClassName={styles.overlay} className={styles.modal}>
      <div className={styles.header}>
        <h3 className={styles.title}>メンバー一覧 ({total})</h3>
        <ModalCloseButton onClick={onClose} />
      </div>

      <div className={styles.body}>
        {loading && <p className={styles.loadingText}>読み込み中...</p>}
        {error && <p className={styles.errorText}>メンバー一覧の取得に失敗しました</p>}

        {!loading && !error && (
          <ul className={styles.memberList}>
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

                <div className={styles.memberInfo}>
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
        {!loading && !error && total > pageSize && (
          <div>
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - pageSize))}>前へ</button>
            <button disabled={offset + pageSize >= total} onClick={() => setOffset(offset + pageSize)}>次へ</button>
          </div>
        )}
      </div>
    </Modal>
  );
};
