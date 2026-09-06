import styles from './UserMeta.module.css';
import { UserNameLink } from '../atoms/UserNameLink';

type Props = {
  userId: string;
  name: string;
  accountID: string;
  timestamp?: string;
  small?: boolean;
  admin?: boolean;
};

export const UserMeta = ({ userId, name, accountID, timestamp, small, admin }: Props) => {
  return (
    <div className={`${styles.row} ${small ? styles.rowSmall : styles.rowNormal}`}>
      <UserNameLink
        userId={userId}
        className={`${styles.name} ${small ? styles.nameSmall : styles.nameNormal}`}
        basePath={admin ? '/admin/users' : '/users'}
        useMyPageForCurrentUser={!admin}
      >
        {name}
      </UserNameLink>
      <span className={`${styles.meta} ${small ? styles.metaSmall : styles.metaNormal}`}>
        @{accountID}
      </span>
      {timestamp && (
        <span className={`${styles.timestamp} ${small ? styles.metaSmall : styles.metaNormal}`}>
          {timestamp}
        </span>
      )}
    </div>
  );
};
