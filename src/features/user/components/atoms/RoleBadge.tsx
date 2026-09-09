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
      data-clickable={onClick ? 'true' : 'false'}
    >
      {isOwner ? 'オーナー' : 'メンバー'}
    </span>
  );
};
