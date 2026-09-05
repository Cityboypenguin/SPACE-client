import type { ReactNode } from 'react';
import { UserAvatar } from '../atoms/UserAvatar';
import { UserNameLink } from '../atoms/UserNameLink';
import styles from './UserListItem.module.css';

type SimpleUser = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

type Props = {
  user: SimpleUser;
  actionButton?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'default' | 'danger';
  disabled?: boolean;
  basePath?: string;
};

export const UserListItem = ({
  user,
  actionButton,
  actionLabel,
  onAction,
  actionVariant = 'default',
  disabled = false,
  basePath = '/users',
}: Props) => {
  const action: ReactNode = actionButton ?? (actionLabel && onAction ? (
    <button
      type="button"
      onClick={onAction}
      disabled={disabled}
      className={`${styles.action} ${actionVariant === 'danger' ? styles.actionDanger : ''}`}
    >
      {actionLabel}
    </button>
  ) : null);

  return (
    <li className={styles.item}>
      <UserAvatar
        userId={user.ID}
        name={user.name}
        avatarUrl={user.avatarUrl}
        size={40}
        basePath={basePath}
        useMyPageForCurrentUser={basePath === '/users'}
      />
      <div className={styles.info}>
        <UserNameLink
          userId={user.ID}
          className={styles.name}
          basePath={basePath}
          useMyPageForCurrentUser={basePath === '/users'}
        >
          {user.name}
        </UserNameLink>
        <span className={styles.accountID}>@{user.accountID}</span>
      </div>
      {action && <div className={styles.actionWrap}>{action}</div>}
    </li>
  );
};
