import { type ReactNode } from 'react';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../../components/atoms/UserNameLink';
import { type Profile } from '../../api/profile';
import styles from './ProfileCard.module.css';

type Props = {
  profile: Profile;
  actions?: ReactNode;
  rightActions?: ReactNode;
};

export const ProfileCard = ({ profile, actions, rightActions }: Props) => (
  <div className={styles.card}>
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <UserAvatar
          userId={profile.user.ID}
          name={profile.user.name}
          avatarUrl={profile.avatarUrl}
          size={120}
        />
        <div className={styles.nameBlock}>
          <UserNameLink userId={profile.user.ID}>
            <div className={styles.name}>{profile.user.name}</div>
          </UserNameLink>
          <div className={styles.account}>@{profile.user.accountID}</div>
        </div>
      </div>
      {rightActions && <div className={styles.headerRight}>{rightActions}</div>}
    </div>

    {profile.bio && (
      <div className={styles.bio}>
        <div className={styles.bioLabel}>自己紹介</div>
        <div className={styles.bioText}>{profile.bio}</div>
      </div>
    )}

    {actions && <div className={styles.actions}>{actions}</div>}
  </div>
);
