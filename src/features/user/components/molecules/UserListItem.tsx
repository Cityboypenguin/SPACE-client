import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../../components/atoms/UserNameLink';
import styles from './UserListItem.module.css';

type User = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

type Props = {
  user: User;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'default' | 'danger';
  disabled?: boolean;
};

export const UserListItem = ({ user, actionLabel, onAction, actionVariant = 'default', disabled = false }: Props) => (
  <li className={styles.item}>
    <UserAvatar userId={user.ID} name={user.name} avatarUrl={user.avatarUrl} size={40} />
    <div className={styles.info}>
      <UserNameLink userId={user.ID} className={styles.name}>{user.name}</UserNameLink>
      <span className={styles.accountID}>@{user.accountID}</span>
    </div>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        disabled={disabled}
        className={`${styles.action} ${actionVariant === 'danger' ? styles.actionDanger : ''}`}
      >
        {actionLabel}
      </button>
    )}
  </li>
);
