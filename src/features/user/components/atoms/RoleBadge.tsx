import styles from './RoleBadge.module.css';

type Props = {
  role: string;
  onClick?: () => void;
};

export const RoleBadge = ({ role, onClick }: Props) => {
  const isOwner = role === 'owner';
  return (
    <span
      onClick={onClick}
      className={`${styles.badge} ${isOwner ? styles.badgeOwner : styles.badgeMember}`}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      {isOwner ? 'オーナー' : 'メンバー'}
    </span>
  );
};
