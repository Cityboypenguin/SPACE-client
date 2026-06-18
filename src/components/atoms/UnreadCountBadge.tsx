import styles from './UnreadCountBadge.module.css';

type Props = {
  count: number;
};

export const UnreadCountBadge = ({ count }: Props) => {
  if (count <= 0) return null;
  return <span className={styles.badge}>{count}</span>;
};
