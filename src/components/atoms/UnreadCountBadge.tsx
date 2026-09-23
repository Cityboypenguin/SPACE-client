import styles from './UnreadCountBadge.module.css';

type Props = {
  count: number;
  // 件数を出さず、未読があることだけを示す小さな赤丸にする。
  dotOnly?: boolean;
};

export const UnreadCountBadge = ({ count, dotOnly = false }: Props) => {
  if (count <= 0) return null;
  if (dotOnly) return <span className={styles.dot} />;
  // 正円を保つため、桁数が増えても大きさは変えずに文字だけ小さくする。
  const label = count > 99 ? '99+' : String(count);
  return <span className={styles.badge} data-length={label.length}>{label}</span>;
};
