import { type ReactNode } from 'react';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { type Profile } from '../../api/profile';
import styles from './ProfileCard.module.css';

type Props = {
  profile: Profile;
  actions?: ReactNode;
};

export const ProfileCard = ({ profile, actions }: Props) => (
  <div className={styles.card}>
    <div className={styles.header}>
      <UserAvatar
        userId={profile.user.ID}
        name={profile.user.name}
        avatarUrl={profile.avatarUrl}
        size={120}
      />
      <div className={styles.nameBlock}>
        <div className={styles.name}>{profile.user.name}</div>
        <div className={styles.account}>@{profile.user.accountID}</div>
      </div>
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
