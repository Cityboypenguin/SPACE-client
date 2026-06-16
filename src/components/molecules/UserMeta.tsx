import styles from './UserMeta.module.css';

type Props = {
  name: string;
  accountID: string;
  timestamp?: string;
  small?: boolean;
};

export const UserMeta = ({ name, accountID, timestamp, small }: Props) => (
  <div className={`${styles.row} ${small ? styles.rowSmall : styles.rowNormal}`}>
    <span className={`${styles.name} ${small ? styles.nameSmall : styles.nameNormal}`}>
      {name}
    </span>
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
