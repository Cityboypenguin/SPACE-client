import styles from './UserMeta.module.css';
import { UserNameLink } from '../atoms/UserNameLink';
import { AdminUserNameLink } from '../atoms/AdminUserNameLink';

type Props = {
  userId: string;
  name: string;
  accountID: string;
  timestamp?: string;
  small?: boolean;
  admin?: boolean;
};

export const UserMeta = ({ userId, name, accountID, timestamp, small, admin }: Props) => {
  const NameLink = admin ? AdminUserNameLink : UserNameLink;
  return (
    <div className={`${styles.row} ${small ? styles.rowSmall : styles.rowNormal}`}>
      <NameLink userId={userId} className={`${styles.name} ${small ? styles.nameSmall : styles.nameNormal}`}>
        {name}
      </NameLink>
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
