import { invitationRemaining } from '../../lib/communityInvitationLinks';
import styles from '../../pages/CommunityInvitationsPage.module.css';

// 招待の有効期限を「あと3日」のように出す。24時間を切ると目立つ色にする。
export const InvitationExpiry = ({ expiresAt }: { expiresAt: string }) => {
  const { label, absolute, urgent } = invitationRemaining(expiresAt);
  return (
    <span className={`${styles.expiry} ${urgent ? styles.expiryUrgent : ''}`} title={`${absolute}まで`}>
      {label}
    </span>
  );
};
